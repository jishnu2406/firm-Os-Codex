-- Create the firm-vault storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-vault',
  'firm-vault',
  false,
  52428800,
  ARRAY['application/pdf','image/png','image/jpeg','image/gif','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload to their own studio folder
CREATE POLICY "studio_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'firm-vault' AND
    (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.firmos_users WHERE id = auth.uid()
    )
  );

-- RLS: users can read their own studio files
CREATE POLICY "studio_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'firm-vault' AND
    (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.firmos_users WHERE id = auth.uid()
    )
  );

-- RLS: users can delete their own uploads
CREATE POLICY "studio_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'firm-vault' AND
    (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.firmos_users WHERE id = auth.uid()
    )
  );
