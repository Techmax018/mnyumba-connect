DROP POLICY IF EXISTS "Views: insert by anyone for existing property" ON public.property_views;
DROP POLICY IF EXISTS "Views: anyone insert" ON public.property_views;
CREATE POLICY "Views: insert with matching viewer" ON public.property_views
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id)
  AND (
    (auth.uid() IS NULL AND viewer_id IS NULL)
    OR (auth.uid() IS NOT NULL AND viewer_id = auth.uid())
  )
);