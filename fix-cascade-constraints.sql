-- Fix CASCADE constraints for LED profile related tables
-- This allows automatic deletion of child records when a profile is deleted

-- 1. led_profile_finishes
ALTER TABLE led_profile_finishes 
  DROP CONSTRAINT IF EXISTS led_profile_finishes_profile_id_fkey;

ALTER TABLE led_profile_finishes
  ADD CONSTRAINT led_profile_finishes_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;

-- 2. led_profile_diffusers
ALTER TABLE led_profile_diffusers 
  DROP CONSTRAINT IF EXISTS led_profile_diffusers_profile_id_fkey;

ALTER TABLE led_profile_diffusers
  ADD CONSTRAINT led_profile_diffusers_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;

-- 3. led_profile_included_items
ALTER TABLE led_profile_included_items 
  DROP CONSTRAINT IF EXISTS led_profile_included_items_profile_id_fkey;

ALTER TABLE led_profile_included_items
  ADD CONSTRAINT led_profile_included_items_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;

-- 4. led_profile_optional_items
ALTER TABLE led_profile_optional_items 
  DROP CONSTRAINT IF EXISTS led_profile_optional_items_profile_id_fkey;

ALTER TABLE led_profile_optional_items
  ADD CONSTRAINT led_profile_optional_items_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;

-- 5. led_profile_media
ALTER TABLE led_profile_media 
  DROP CONSTRAINT IF EXISTS led_profile_media_profile_id_fkey;

ALTER TABLE led_profile_media
  ADD CONSTRAINT led_profile_media_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;

-- 6. led_profile_parts
ALTER TABLE led_profile_parts 
  DROP CONSTRAINT IF EXISTS led_profile_parts_profile_id_fkey;

ALTER TABLE led_profile_parts
  ADD CONSTRAINT led_profile_parts_profile_id_fkey 
  FOREIGN KEY (profile_id) 
  REFERENCES led_profiles(id) 
  ON DELETE CASCADE;
