
-- 1) Role claim via SECURITY DEFINER; remove permissive INSERT
DROP POLICY IF EXISTS "Users can insert their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.claim_role(_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _role NOT IN ('tenant','landlord') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Role already assigned';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), _role);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_role(public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_role(public.app_role) TO authenticated;

-- 2) Profiles: owner-only read (no public PII exposure)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles: own select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3) wifi_vendors: restrict to landlord owner OR tenant with a payment on the property
DROP POLICY IF EXISTS "Wifi vendors readable" ON public.wifi_vendors;
DROP POLICY IF EXISTS "wifi_vendors select" ON public.wifi_vendors;
DROP POLICY IF EXISTS "Wifi vendors viewable by everyone" ON public.wifi_vendors;
CREATE POLICY "Wifi vendors: scoped read"
  ON public.wifi_vendors FOR SELECT
  TO authenticated
  USING (
    landlord_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rent_payments rp
      WHERE rp.tenant_id = auth.uid() AND rp.property_id = wifi_vendors.property_id
    )
    OR EXISTS (
      SELECT 1 FROM public.wifi_payments wp
      WHERE wp.tenant_id = auth.uid() AND wp.property_id = wifi_vendors.property_id
    )
  );

-- 4) Rent payments: remove direct tenant insert/update; route through RPC
DROP POLICY IF EXISTS "Rent: tenant insert own" ON public.rent_payments;
DROP POLICY IF EXISTS "Rent: tenant update own" ON public.rent_payments;

CREATE OR REPLACE FUNCTION public.record_rent_payment(
  p_property_id uuid,
  p_period_month date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.rent_payments
    (tenant_id, landlord_id, property_id, amount_kes, period_month, status, paid_at)
  VALUES
    (auth.uid(), v_landlord, p_property_id, v_amount, date_trunc('month', p_period_month)::date,
     'paid', now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_rent_payment(uuid, date) FROM public;
GRANT EXECUTE ON FUNCTION public.record_rent_payment(uuid, date) TO authenticated;

-- 5) Wifi payments: remove direct tenant insert/update; route through RPC
DROP POLICY IF EXISTS "Wifi pay tenant insert" ON public.wifi_payments;
DROP POLICY IF EXISTS "Wifi pay tenant update" ON public.wifi_payments;

CREATE OR REPLACE FUNCTION public.record_wifi_payment(
  p_vendor_id uuid,
  p_period_month date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor public.wifi_vendors%ROWTYPE;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_vendor FROM public.wifi_vendors WHERE id = p_vendor_id;
  IF v_vendor.id IS NULL THEN RAISE EXCEPTION 'Vendor not found'; END IF;
  IF v_vendor.landlord_id = auth.uid() THEN RAISE EXCEPTION 'Landlords cannot pay their own vendor'; END IF;

  INSERT INTO public.wifi_payments
    (tenant_id, landlord_id, property_id, vendor_id, vendor_name, amount_kes,
     period_month, status, paid_at)
  VALUES
    (auth.uid(), v_vendor.landlord_id, v_vendor.property_id, v_vendor.id, v_vendor.name,
     v_vendor.monthly_price_kes,
     date_trunc('month', p_period_month)::date, 'paid', now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_wifi_payment(uuid, date) FROM public;
GRANT EXECUTE ON FUNCTION public.record_wifi_payment(uuid, date) TO authenticated;

-- 6) Storage: only landlords can upload to property-images bucket
DROP POLICY IF EXISTS "Authenticated can upload property images" ON storage.objects;
CREATE POLICY "Landlords can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND public.has_role(auth.uid(), 'landlord')
  );

-- 7) Realtime channel authorization: restrict per-user notifs:{uid}:* topics
DO $$ BEGIN
  CREATE POLICY "Realtime: own user topics"
    ON realtime.messages FOR SELECT
    TO authenticated
    USING (
      -- Allow topics that start with 'notifs:<auth.uid()>:'
      split_part(topic, ':', 1) <> 'notifs'
      OR split_part(topic, ':', 2) = auth.uid()::text
    );
EXCEPTION WHEN insufficient_privilege THEN NULL; WHEN duplicate_object THEN NULL; END $$;
