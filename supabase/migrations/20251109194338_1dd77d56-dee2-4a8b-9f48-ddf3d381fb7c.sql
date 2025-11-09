-- Add serving size fields to meals table
ALTER TABLE public.meals 
ADD COLUMN IF NOT EXISTS serving_size numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS estimated_serving text,
ADD COLUMN IF NOT EXISTS serving_unit text;