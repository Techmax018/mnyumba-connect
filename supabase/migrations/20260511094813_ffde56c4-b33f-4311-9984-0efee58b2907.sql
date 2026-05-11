
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_landlord_id_fkey;
ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_tenant_id_fkey;

CREATE TYPE public.inquiry_status AS ENUM ('new', 'seen', 'replied');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.notification_type AS ENUM ('inquiry_new', 'inquiry_reply', 'payment_received', 'payment_confirmed', 'system');

ALTER TABLE public.inquiries
  ADD COLUMN status public.inquiry_status NOT NULL DEFAULT 'new',
  ADD COLUMN landlord_reply text,
  ADD COLUMN seen_at timestamptz,
  ADD COLUMN replied_at timestamptz;

ALTER TABLE public.properties ADD COLUMN is_demo boolean NOT NULL DEFAULT false;

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Favorites: own select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Favorites: own insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Favorites: own delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notif: own select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notif: own update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_notif_user_created ON public.notifications(user_id, created_at DESC);

CREATE TABLE public.property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Views: anyone insert" ON public.property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Views: landlord select own" ON public.property_views FOR SELECT
  USING (auth.uid() IN (SELECT landlord_id FROM public.properties WHERE id = property_views.property_id));
CREATE INDEX idx_views_property_created ON public.property_views(property_id, created_at DESC);

CREATE TABLE public.rent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount_kes integer NOT NULL,
  period_month date NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rent: tenant select own" ON public.rent_payments FOR SELECT
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Rent: tenant insert own" ON public.rent_payments FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Rent: tenant update own" ON public.rent_payments FOR UPDATE
  USING (auth.uid() = tenant_id);
CREATE INDEX idx_rent_landlord ON public.rent_payments(landlord_id, created_at DESC);
CREATE INDEX idx_rent_tenant ON public.rent_payments(tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_on_inquiry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_landlord uuid; v_title text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT landlord_id, title INTO v_landlord, v_title FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (v_landlord, 'inquiry_new', 'New inquiry on ' || COALESCE(v_title, 'your listing'),
            LEFT(NEW.message, 140), '/dashboard/landlord?tab=inquiries');
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'replied' AND (OLD.status IS DISTINCT FROM 'replied') AND NEW.tenant_id IS NOT NULL THEN
    SELECT title INTO v_title FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.tenant_id, 'inquiry_reply', 'Landlord replied: ' || COALESCE(v_title, 'your inquiry'),
            LEFT(COALESCE(NEW.landlord_reply, ''), 140), '/dashboard/tenant?tab=inquiries');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_inquiry_insert AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_inquiry();
CREATE TRIGGER trg_inquiry_update AFTER UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_inquiry();

CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title text;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    SELECT title INTO v_title FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.landlord_id, 'payment_received', 'Rent received: ' || COALESCE(v_title, ''),
            'KES ' || NEW.amount_kes::text || ' for ' || to_char(NEW.period_month, 'Mon YYYY'),
            '/dashboard/landlord?tab=tracker');
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.tenant_id, 'payment_confirmed', 'Payment confirmed: ' || COALESCE(v_title, ''),
            'KES ' || NEW.amount_kes::text || ' for ' || to_char(NEW.period_month, 'Mon YYYY'),
            '/dashboard/tenant?tab=payments');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_payment_paid AFTER UPDATE ON public.rent_payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payment();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;

DO $$
DECLARE
  l1 uuid := '11111111-1111-1111-1111-111111111111';
  l2 uuid := '22222222-2222-2222-2222-222222222222';
  t1 uuid := '33333333-3333-3333-3333-333333333333';
  t2 uuid := '44444444-4444-4444-4444-444444444444';
  t3 uuid := '55555555-5555-5555-5555-555555555555';
  pid uuid;
  pids uuid[] := ARRAY[]::uuid[];
  cities text[] := ARRAY['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret'];
  locs text[] := ARRAY['Westlands','Kilimani','Lavington','Karen','Nyali','Bamburi','Milimani','Tom Mboya','Section 58','Pipeline'];
  ptypes property_type[] := ARRAY['single_room','bedsitter','one_br','two_br','three_br','four_br_plus']::property_type[];
  imgs text[] := ARRAY[
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
  ];
  i int; ll uuid; pt property_type; bd int; rent int;
BEGIN
  FOR i IN 1..25 LOOP
    ll := CASE WHEN i % 2 = 0 THEN l1 ELSE l2 END;
    pt := ptypes[1 + (i % 6)];
    bd := CASE pt WHEN 'single_room' THEN 0 WHEN 'bedsitter' THEN 0 WHEN 'one_br' THEN 1
                  WHEN 'two_br' THEN 2 WHEN 'three_br' THEN 3 ELSE 4 END;
    rent := CASE pt WHEN 'single_room' THEN 5000 + (i*200) WHEN 'bedsitter' THEN 12000 + (i*300)
                    WHEN 'one_br' THEN 25000 + (i*500) WHEN 'two_br' THEN 45000 + (i*1000)
                    WHEN 'three_br' THEN 75000 + (i*1500) ELSE 120000 + (i*2000) END;
    INSERT INTO public.properties (
      landlord_id, title, property_type, city, location, monthly_rent_kes,
      bedrooms, bathrooms, description, wifi, water, parking, security, balcony, fenced,
      images, status, is_demo
    ) VALUES (
      ll, INITCAP(REPLACE(pt::text, '_', ' ')) || ' in ' || locs[1 + (i % 10)],
      pt, cities[1 + (i % 5)], locs[1 + (i % 10)], rent, bd, GREATEST(1, bd),
      'Spacious and well-maintained ' || REPLACE(pt::text, '_', ' ') || ' in a quiet neighborhood. Close to shops, schools, and public transport.',
      i % 2 = 0, true, i % 3 = 0, i % 2 = 1, i % 4 = 0, i % 3 = 1,
      ARRAY[imgs[1 + (i % 8)], imgs[1 + ((i+3) % 8)]],
      'available'::property_status, true
    ) RETURNING id INTO pid;
    pids := array_append(pids, pid);
  END LOOP;

  FOR i IN 1..40 LOOP
    INSERT INTO public.inquiries (property_id, tenant_id, contact_email, contact_phone, message, status, created_at, seen_at, replied_at, landlord_reply)
    VALUES (
      pids[1 + (i % 25)],
      CASE i % 3 WHEN 0 THEN t1 WHEN 1 THEN t2 ELSE t3 END,
      CASE i % 3 WHEN 0 THEN 'brian.o@demo.mnyumba' WHEN 1 THEN 'faith.n@demo.mnyumba' ELSE 'samuel.k@demo.mnyumba' END,
      '+25470000' || LPAD((1000+i)::text, 4, '0'),
      'Hi, is this still available? I would like to view it this weekend. Could you share more photos and confirm the deposit amount?',
      CASE i % 3 WHEN 0 THEN 'new'::inquiry_status WHEN 1 THEN 'seen'::inquiry_status ELSE 'replied'::inquiry_status END,
      now() - (i || ' days')::interval,
      CASE WHEN i % 3 <> 0 THEN now() - ((i-1) || ' days')::interval ELSE NULL END,
      CASE WHEN i % 3 = 2 THEN now() - ((i-2) || ' days')::interval ELSE NULL END,
      CASE WHEN i % 3 = 2 THEN 'Yes, still available. Deposit is one month rent. You can view this Saturday from 10am.' ELSE NULL END
    );
  END LOOP;

  FOR i IN 1..60 LOOP
    BEGIN
      INSERT INTO public.favorites (user_id, property_id)
      VALUES (CASE i % 3 WHEN 0 THEN t1 WHEN 1 THEN t2 ELSE t3 END, pids[1 + (i % 25)]);
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END LOOP;

  FOR i IN 1..120 LOOP
    INSERT INTO public.property_views (property_id, viewer_id, created_at)
    VALUES (pids[1 + (i % 25)], NULL, now() - ((i % 30) || ' days')::interval - ((i % 24) || ' hours')::interval);
  END LOOP;

  FOR i IN 1..30 LOOP
    INSERT INTO public.rent_payments (tenant_id, landlord_id, property_id, amount_kes, period_month, status, paid_at, created_at)
    SELECT
      CASE i % 3 WHEN 0 THEN t1 WHEN 1 THEN t2 ELSE t3 END,
      p.landlord_id, p.id, p.monthly_rent_kes,
      date_trunc('month', now() - ((i % 6) || ' months')::interval)::date,
      CASE WHEN i % 7 = 0 THEN 'pending'::payment_status ELSE 'paid'::payment_status END,
      CASE WHEN i % 7 = 0 THEN NULL ELSE now() - ((i % 180) || ' days')::interval END,
      now() - ((i % 180) || ' days')::interval
    FROM public.properties p WHERE p.id = pids[1 + (i % 25)];
  END LOOP;
END $$;
