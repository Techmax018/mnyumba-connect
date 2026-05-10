
-- Function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Tighten bot_logs insert
DROP POLICY IF EXISTS "Anyone can insert bot logs" ON public.bot_logs;
CREATE POLICY "Bot logs insert by self or anon" ON public.bot_logs
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Storage: only authenticated can list/read; public access still possible via signed/public URL? bucket public means files served publicly via URL.
-- Replace broad SELECT to limit listing
DROP POLICY IF EXISTS "Property images public read" ON storage.objects;
CREATE POLICY "Property images authed read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Revoke execute on security definer funcs from anon/authenticated (called via RLS USING clauses still works as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
