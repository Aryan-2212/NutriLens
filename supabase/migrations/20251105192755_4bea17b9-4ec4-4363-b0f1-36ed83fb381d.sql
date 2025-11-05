-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT;

-- Add unique constraint for username
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);