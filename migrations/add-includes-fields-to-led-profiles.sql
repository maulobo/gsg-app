-- Add includes_led and includes_power_supply fields to led_profiles table
-- These fields indicate whether the LED profile includes LED and/or power supply

ALTER TABLE led_profiles 
ADD COLUMN IF NOT EXISTS includes_led BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_power_supply BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN led_profiles.includes_led IS 'Indicates if this LED profile includes LED strips';
COMMENT ON COLUMN led_profiles.includes_power_supply IS 'Indicates if this LED profile includes a power supply/transformer';
