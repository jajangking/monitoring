-- SQL Schema for Custom Oil Change Interval Preference
-- This is an independent script to create/add the oil change interval preference functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_preferences table (will not fail if table already exists, thanks to IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users DEFAULT auth.uid(),
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  CONSTRAINT unique_user_preference UNIQUE (user_id, preference_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON public.user_preferences (preference_key);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences table (will not fail if policies already exist)
DO $$
BEGIN
  -- Check if policy exists, create if it doesn't
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences'
    )
  ) THEN
    CREATE POLICY "Users can view their own preferences" ON public.user_preferences
      FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences'
    )
  ) THEN
    CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences'
    )
  ) THEN
    CREATE POLICY "Users can update their own preferences" ON public.user_preferences
      FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_preferences' AND policyname = 'Users can delete their own preferences'
    )
  ) THEN
    CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
      FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- Grant permissions (safe to run multiple times)
GRANT ALL PRIVILEGES ON TABLE public.user_preferences TO anon;
GRANT ALL PRIVILEGES ON TABLE public.user_preferences TO service_role;

-- Create the function for auto timestamps (CREATE OR REPLACE handles duplicates)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for user_preferences table (CREATE OR REPLACE handles duplicates)
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Example usage for oil change intervals:
-- To store a custom oil change interval:
-- INSERT INTO public.user_preferences (preference_key, preference_value) 
-- VALUES ('oil_change_interval', '3000')
-- ON CONFLICT (user_id, preference_key) DO UPDATE SET
--   preference_value = EXCLUDED.preference_value,
--   updated_at = NOW();

-- To retrieve the custom oil change interval:
-- SELECT preference_value FROM public.user_preferences 
-- WHERE preference_key = 'oil_change_interval';

-- Refresh the schema cache to ensure PostgREST recognizes all tables and columns
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'User preferences table for oil change intervals configured successfully!' as message;