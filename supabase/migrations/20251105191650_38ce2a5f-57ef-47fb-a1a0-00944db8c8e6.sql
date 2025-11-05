-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true);

-- Create RLS policies for meal images
CREATE POLICY "Users can upload their own meal images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view meal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'meal-images');

CREATE POLICY "Users can update their own meal images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meal images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);