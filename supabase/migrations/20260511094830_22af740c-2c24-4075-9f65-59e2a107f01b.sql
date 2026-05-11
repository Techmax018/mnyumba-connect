
REVOKE EXECUTE ON FUNCTION public.notify_on_inquiry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_payment() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Views: anyone insert" ON public.property_views;
CREATE POLICY "Views: insert by anyone for existing property" ON public.property_views
  FOR INSERT
  WITH CHECK (property_id IN (SELECT id FROM public.properties WHERE status <> 'archived'));
