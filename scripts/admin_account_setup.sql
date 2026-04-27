-- EiE Education Admin Account Creation Script (Revised)
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  admin_id TEXT := 'admin';
  admin_email TEXT := 'admin@eie.com';
  admin_pass TEXT := 'admin';
BEGIN
  -- 1. Insert into auth.users (Supabase Auth)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  VALUES (
    new_user_id, '00000000-0000-0000-0000-000000000000', admin_email,
    crypt(admin_pass, gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"EiE Administrator","role":"admin"}',
    'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO NOTHING;

  -- 2. Insert into public.profiles (Application Logic)
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    (SELECT id FROM auth.users WHERE email = admin_email),
    'EiE Administrator', admin_email, 'admin'
  )
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Admin account creation process finished for: %', admin_email;
  RAISE NOTICE 'You can now login with ID: % and PWD: %', admin_id, admin_pass;
END $$;
