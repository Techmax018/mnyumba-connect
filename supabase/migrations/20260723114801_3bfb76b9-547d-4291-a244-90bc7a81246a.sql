
-- 1) Public read for property images (bucket is public; listings need to render for anon visitors)
DROP POLICY IF EXISTS "Property images authed read" ON storage.objects;
CREATE POLICY "Property images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- 2) Tighten UPDATE/DELETE: require owner match, landlord role, path prefix = auth.uid(),
--    AND an actual properties row owned by this landlord (join to properties).
DROP POLICY IF EXISTS "Owners manage their property images" ON storage.objects;
CREATE POLICY "Landlords manage their property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images'
  AND auth.uid() = owner
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'landlord'::public.app_role)
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.landlord_id = auth.uid())
)
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.uid() = owner
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'landlord'::public.app_role)
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.landlord_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners delete their property images" ON storage.objects;
CREATE POLICY "Landlords delete their property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND auth.uid() = owner
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND public.has_role(auth.uid(), 'landlord'::public.app_role)
  AND EXISTS (SELECT 1 FROM public.properties p WHERE p.landlord_id = auth.uid())
);
