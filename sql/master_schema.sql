-- Complete Supabase Schema for Monitoring App
-- Combined from all individual SQL files
-- This script can be run multiple times safely without errors
-- Run this complete script in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (WARNING: This will delete existing data!)
-- Only do this if you want to reset all data, otherwise the tables will be created if they don't exist
DROP TABLE IF EXISTS public.spareparts CASCADE;
DROP TABLE IF EXISTS public.daily_mileage CASCADE;
DROP TABLE IF EXISTS public.oil_changes CASCADE;
DROP TABLE IF EXISTS public.fuel_expenses CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  quantity INTEGER,
  price_per_item DECIMAL(10,2),
  order_type TEXT,  -- Added for Regular/Paket order classification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_expenses table
CREATE TABLE public.fuel_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters DECIMAL(8,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create oil_changes table
CREATE TABLE public.oil_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mileage BIGINT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_mileage table to store daily mileage records
CREATE TABLE public.daily_mileage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users DEFAULT auth.uid()
);

-- Create spareparts table to store spare part records
CREATE TABLE public.spareparts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  mileage_installed INTEGER NOT NULL,
  estimated_mileage INTEGER NOT NULL,
  mileage_replaced INTEGER,
  date_installed DATE NOT NULL,
  date_replaced DATE,
  note TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'replaced')),
  created_by UUID REFERENCES auth.users DEFAULT auth.uid()
);

-- Create user_preferences table to store user settings like custom oil change intervals
CREATE TABLE public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users DEFAULT auth.uid(),
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  CONSTRAINT unique_user_preference UNIQUE (user_id, preference_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_expenses_date ON fuel_expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_oil_changes_date ON oil_changes (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_mileage_date ON daily_mileage (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_mileage_created_at ON daily_mileage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spareparts_date_installed ON spareparts (date_installed DESC);
CREATE INDEX IF NOT EXISTS idx_spareparts_status ON spareparts (status);
CREATE INDEX IF NOT EXISTS idx_spareparts_created_at ON spareparts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences (preference_key);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for orders, fuel_expenses, and oil_changes tables
CREATE POLICY "Allow all access to orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all access to fuel_expenses" ON public.fuel_expenses FOR ALL USING (true);
CREATE POLICY "Allow all access to oil_changes" ON public.oil_changes FOR ALL USING (true);

-- Create policies for daily_mileage table to allow users to access their own records
CREATE POLICY "Users can view their own daily mileage records" ON public.daily_mileage
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own daily mileage records" ON public.daily_mileage
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own daily mileage records" ON public.daily_mileage
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own daily mileage records" ON public.daily_mileage
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

-- Create policies for spareparts table
CREATE POLICY "Users can view their own sparepart records" ON public.spareparts
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own sparepart records" ON public.spareparts
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own sparepart records" ON public.spareparts
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own sparepart records" ON public.spareparts
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

-- Create policies for user_preferences table
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE public.orders TO anon;
GRANT ALL PRIVILEGES ON TABLE public.orders TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.fuel_expenses TO anon;
GRANT ALL PRIVILEGES ON TABLE public.fuel_expenses TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.oil_changes TO anon;
GRANT ALL PRIVILEGES ON TABLE public.oil_changes TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.daily_mileage TO anon;
GRANT ALL PRIVILEGES ON TABLE public.daily_mileage TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.spareparts TO anon;
GRANT ALL PRIVILEGES ON TABLE public.spareparts TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_preferences TO anon;
GRANT ALL PRIVILEGES ON TABLE public.user_preferences TO service_role;

-- Add triggers for auto timestamps (create function first, then triggers)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for auto timestamps
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_expenses_updated_at
  BEFORE UPDATE ON fuel_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_changes_updated_at
  BEFORE UPDATE ON oil_changes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_mileage_updated_at
  BEFORE UPDATE ON daily_mileage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spareparts_updated_at
  BEFORE UPDATE ON spareparts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints to prevent duplicate entries
DO $$
BEGIN
  -- Add the constraint only if it doesn't already exist
  BEGIN
    ALTER TABLE public.daily_mileage ADD CONSTRAINT unique_user_date_mileage UNIQUE (created_by, date);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Do nothing if constraint already exists
      NULL;
  END;
END $$;

-- Optionally add constraint for spareparts (commented out in case it's not needed)
-- DO $$
-- BEGIN
--   BEGIN
--     ALTER TABLE public.spareparts ADD CONSTRAINT unique_user_part_installed_date UNIQUE (created_by, name, date_installed);
--   EXCEPTION
--     WHEN duplicate_object THEN
--       -- Do nothing if constraint already exists
--       NULL;
--   END;
-- END $$;

-- Refresh the schema cache to ensure PostgREST recognizes all tables and columns
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'All tables created or updated successfully with proper schema and schema cache refreshed!' as message;