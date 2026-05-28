-- Create room-uploads bucket as private with size/type constraints.
-- Run via Supabase CLI (supabase db push) or paste into the SQL editor at
-- app.supabase.com > SQL Editor.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-uploads',
  'room-uploads',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop any pre-existing policies so this migration is idempotent.
DROP POLICY IF EXISTS "room_uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "room_uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "room_uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "room_uploads_delete" ON storage.objects;

-- Authenticated users may INSERT only into their own folder.
CREATE POLICY "room_uploads_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'room-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users may SELECT (download / createSignedUrl) only their own files.
CREATE POLICY "room_uploads_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'room-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users may UPDATE only their own files.
CREATE POLICY "room_uploads_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'room-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users may DELETE only their own files.
CREATE POLICY "room_uploads_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'room-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
