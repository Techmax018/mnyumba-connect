
-- Reminder kinds
DO $$ BEGIN
  CREATE TYPE reminder_kind AS ENUM ('rent_due','wifi_renewal','inquiry_followup','custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind reminder_kind NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  body text,
  link text,
  related_id uuid,
  remind_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reminders: own select" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Reminders: own insert" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Reminders: own update" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Reminders: own delete" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_time ON public.reminders(user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(remind_at) WHERE sent = false;

-- Add notification types
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reminder';
EXCEPTION WHEN others THEN null; END $$;

-- Daily processor: deliver due reminders into notifications and seed system reminders
CREATE OR REPLACE FUNCTION public.process_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  -- Auto-create monthly rent reminders 3 days before the 1st of each month
  INSERT INTO public.reminders (user_id, kind, title, body, link, related_id, remind_at)
  SELECT DISTINCT rp.tenant_id, 'rent_due',
         'Rent due soon',
         'Your monthly rent will be due on the 1st. Tap to pay.',
         '/dashboard/tenant?tab=payments',
         rp.property_id,
         date_trunc('month', now()) + interval '1 month' - interval '3 days'
  FROM public.rent_payments rp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.reminders r
    WHERE r.user_id = rp.tenant_id AND r.kind = 'rent_due'
      AND r.remind_at = date_trunc('month', now()) + interval '1 month' - interval '3 days'
  );

  -- Auto-create WiFi renewal reminders 3 days before next period
  INSERT INTO public.reminders (user_id, kind, title, body, link, related_id, remind_at)
  SELECT DISTINCT wp.tenant_id, 'wifi_renewal',
         'WiFi renewal coming up',
         'Your WiFi subscription with ' || wp.vendor_name || ' renews soon.',
         '/dashboard/tenant?tab=wifi',
         wp.property_id,
         (wp.period_month + interval '1 month' - interval '3 days')::timestamptz
  FROM public.wifi_payments wp
  WHERE wp.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.user_id = wp.tenant_id AND r.kind = 'wifi_renewal'
        AND r.related_id = wp.property_id
        AND r.remind_at = (wp.period_month + interval '1 month' - interval '3 days')::timestamptz
    );

  -- Landlord inquiry follow-up after 48h with no reply
  INSERT INTO public.reminders (user_id, kind, title, body, link, related_id, remind_at)
  SELECT p.landlord_id, 'inquiry_followup',
         'Unanswered inquiry',
         'You have an inquiry waiting more than 48 hours for a reply.',
         '/dashboard/landlord?tab=inquiries',
         i.id,
         now()
  FROM public.inquiries i
  JOIN public.properties p ON p.id = i.property_id
  WHERE i.status <> 'replied'
    AND i.created_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.reminders r
      WHERE r.user_id = p.landlord_id AND r.kind = 'inquiry_followup' AND r.related_id = i.id
    );

  -- Push due reminders to notifications
  FOR r IN SELECT * FROM public.reminders WHERE sent = false AND remind_at <= now() LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (r.user_id, 'reminder', r.title, r.body, r.link);
    UPDATE public.reminders SET sent = true WHERE id = r.id;
  END LOOP;
END;
$$;

-- Schedule daily at 08:00
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN others THEN null; END $$;

DO $$
DECLARE jid int;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-reminders-daily';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
  PERFORM cron.schedule('process-reminders-daily', '0 8 * * *', $cron$ SELECT public.process_reminders(); $cron$);
END $$;
