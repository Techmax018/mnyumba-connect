
-- 1. WiFi vendors: drop overly-permissive public SELECT
DROP POLICY IF EXISTS "Wifi vendors viewable by all" ON public.wifi_vendors;
REVOKE SELECT ON public.wifi_vendors FROM anon;

-- 2. user_roles: revoke write grants from authenticated; default-deny RLS already blocks but make it explicit
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated, anon;
-- Explicit restrictive policies so future grants don't accidentally open writes
CREATE POLICY "No client writes to user_roles - insert"
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client writes to user_roles - update"
  ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client writes to user_roles - delete"
  ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);

-- 3. bot_logs: explicit owner-only SELECT policy
CREATE POLICY "Bot logs readable by owner"
  ON public.bot_logs FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- 4. Remove inquiries from realtime publication (prevents broadcast leak of contact details)
ALTER PUBLICATION supabase_realtime DROP TABLE public.inquiries;

-- 5. Deduplicate payments + require tenant relationship
-- Backfill cleanup: keep only the first row per (tenant, property, period_month)
DELETE FROM public.rent_payments a USING public.rent_payments b
  WHERE a.ctid < b.ctid AND a.tenant_id = b.tenant_id
  AND a.property_id = b.property_id AND a.period_month = b.period_month;
DELETE FROM public.wifi_payments a USING public.wifi_payments b
  WHERE a.ctid < b.ctid AND a.tenant_id = b.tenant_id
  AND a.vendor_id = b.vendor_id AND a.period_month = b.period_month;

CREATE UNIQUE INDEX IF NOT EXISTS rent_payments_tenant_property_period_uniq
  ON public.rent_payments (tenant_id, property_id, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS wifi_payments_tenant_vendor_period_uniq
  ON public.wifi_payments (tenant_id, vendor_id, period_month);

-- 6. Harden RPCs: require an existing inquiry from caller for this property
CREATE OR REPLACE FUNCTION public.record_rent_payment(p_property_id uuid, p_period_month date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_landlord uuid;
  v_amount numeric;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT landlord_id, monthly_rent_kes INTO v_landlord, v_amount
  FROM public.properties WHERE id = p_property_id;
  IF v_landlord IS NULL THEN RAISE EXCEPTION 'Property not found'; END IF;
  IF v_landlord = auth.uid() THEN RAISE EXCEPTION 'Landlords cannot pay their own property'; END IF;

  -- Require a prior tenant relationship: an inquiry on the property, or an existing payment
  IF NOT EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE property_id = p_property_id AND tenant_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.rent_payments
    WHERE property_id = p_property_id AND tenant_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must contact the landlord (send an inquiry) before recording a payment';
  END IF;

  INSERT INTO public.rent_payments
    (tenant_id, landlord_id, property_id, amount_kes, period_month, status, paid_at)
  VALUES
    (auth.uid(), v_landlord, p_property_id, v_amount, date_trunc('month', p_period_month)::date,
     'paid', now())
  ON CONFLICT (tenant_id, property_id, period_month) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Payment for this month already recorded'; END IF;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_wifi_payment(p_vendor_id uuid, p_period_month date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_vendor public.wifi_vendors%ROWTYPE;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_vendor FROM public.wifi_vendors WHERE id = p_vendor_id;
  IF v_vendor.id IS NULL THEN RAISE EXCEPTION 'Vendor not found'; END IF;
  IF v_vendor.landlord_id = auth.uid() THEN RAISE EXCEPTION 'Landlords cannot pay their own vendor'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE property_id = v_vendor.property_id AND tenant_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.rent_payments
    WHERE property_id = v_vendor.property_id AND tenant_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.wifi_payments
    WHERE property_id = v_vendor.property_id AND tenant_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must contact the landlord first before paying for WiFi at this property';
  END IF;

  INSERT INTO public.wifi_payments
    (tenant_id, landlord_id, property_id, vendor_id, vendor_name, amount_kes,
     period_month, status, paid_at)
  VALUES
    (auth.uid(), v_vendor.landlord_id, v_vendor.property_id, v_vendor.id, v_vendor.name,
     v_vendor.monthly_price_kes,
     date_trunc('month', p_period_month)::date, 'paid', now())
  ON CONFLICT (tenant_id, vendor_id, period_month) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'WiFi payment for this month already recorded'; END IF;
  RETURN v_id;
END;
$function$;

-- 7. Revoke EXECUTE on SECURITY DEFINER functions from anon (and trigger-only functions from public)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_role(app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_rent_payment(uuid, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_wifi_payment(uuid, date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.process_reminders() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_inquiry() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_payment() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_rent_payment(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_wifi_payment(uuid, date) TO authenticated;
