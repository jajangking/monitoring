-- Enhanced Supabase Schema for User-Specific Data with Google OAuth Support
-- This script updates existing tables to include user association and RLS policies

-- First, make sure all necessary user_id columns exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
ALTER TABLE public.fuel_expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
ALTER TABLE public.oil_changes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_fuel_expenses_created_by ON public.fuel_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_oil_changes_created_by ON public.oil_changes(created_by);
CREATE INDEX IF NOT EXISTS idx_spareparts_created_by ON public.spareparts(created_by);
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_by ON public.motorcycles(created_by);

-- Drop existing policies if they exist (to update them)
DO $$ 
BEGIN
  -- Drop old policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
    DROP POLICY "Users can view their own orders" ON public.orders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert their own orders') THEN
    DROP POLICY "Users can insert their own orders" ON public.orders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can update their own orders') THEN
    DROP POLICY "Users can update their own orders" ON public.orders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can delete their own orders') THEN
    DROP POLICY "Users can delete their own orders" ON public.orders;
  END IF;
  
  -- Drop fuel_expenses policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_expenses' AND policyname = 'Users can view their own fuel expenses') THEN
    DROP POLICY "Users can view their own fuel expenses" ON public.fuel_expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_expenses' AND policyname = 'Users can insert their own fuel expenses') THEN
    DROP POLICY "Users can insert their own fuel expenses" ON public.fuel_expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_expenses' AND policyname = 'Users can update their own fuel expenses') THEN
    DROP POLICY "Users can update their own fuel expenses" ON public.fuel_expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_expenses' AND policyname = 'Users can delete their own fuel expenses') THEN
    DROP POLICY "Users can delete their own fuel expenses" ON public.fuel_expenses;
  END IF;
  
  -- Drop oil_changes policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oil_changes' AND policyname = 'Users can view their own oil changes') THEN
    DROP POLICY "Users can view their own oil changes" ON public.oil_changes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oil_changes' AND policyname = 'Users can insert their own oil changes') THEN
    DROP POLICY "Users can insert their own oil changes" ON public.oil_changes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oil_changes' AND policyname = 'Users can update their own oil changes') THEN
    DROP POLICY "Users can update their own oil changes" ON public.oil_changes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oil_changes' AND policyname = 'Users can delete their own oil changes') THEN
    DROP POLICY "Users can delete their own oil changes" ON public.oil_changes;
  END IF;
  
  -- Drop spareparts policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spareparts' AND policyname = 'Users can view their own sparepart records') THEN
    DROP POLICY "Users can view their own sparepart records" ON public.spareparts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spareparts' AND policyname = 'Users can insert their own sparepart records') THEN
    DROP POLICY "Users can insert their own sparepart records" ON public.spareparts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spareparts' AND policyname = 'Users can update their own sparepart records') THEN
    DROP POLICY "Users can update their own sparepart records" ON public.spareparts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spareparts' AND policyname = 'Users can delete their own sparepart records') THEN
    DROP POLICY "Users can delete their own sparepart records" ON public.spareparts;
  END IF;
  
  -- Drop motorcycles policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'motorcycles' AND policyname = 'Users can view their own motorcycles') THEN
    DROP POLICY "Users can view their own motorcycles" ON public.motorcycles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'motorcycles' AND policyname = 'Users can insert their own motorcycles') THEN
    DROP POLICY "Users can insert their own motorcycles" ON public.motorcycles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'motorcycles' AND policyname = 'Users can update their own motorcycles') THEN
    DROP POLICY "Users can update their own motorcycles" ON public.motorcycles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'motorcycles' AND policyname = 'Users can delete their own motorcycles') THEN
    DROP POLICY "Users can delete their own motorcycles" ON public.motorcycles;
  END IF;
  
  -- Drop the old "Allow all access" policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow all access to orders') THEN
    DROP POLICY "Allow all access to orders" ON public.orders;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_expenses' AND policyname = 'Allow all access to fuel_expenses') THEN
    DROP POLICY "Allow all access to fuel_expenses" ON public.fuel_expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'oil_changes' AND policyname = 'Allow all access to oil_changes') THEN
    DROP POLICY "Allow all access to oil_changes" ON public.oil_changes;
  END IF;

  -- Create new RLS policies for user-specific access
  CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can delete their own orders" ON public.orders
    FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can view their own fuel expenses" ON public.fuel_expenses
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can insert their own fuel expenses" ON public.fuel_expenses
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can update their own fuel expenses" ON public.fuel_expenses
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can delete their own fuel expenses" ON public.fuel_expenses
    FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can view their own oil changes" ON public.oil_changes
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can insert their own oil changes" ON public.oil_changes
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can update their own oil changes" ON public.oil_changes
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can delete their own oil changes" ON public.oil_changes
    FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can view their own sparepart records" ON public.spareparts
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can insert their own sparepart records" ON public.spareparts
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can update their own sparepart records" ON public.spareparts
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can delete their own sparepart records" ON public.spareparts
    FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can view their own motorcycles" ON public.motorcycles
    FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can insert their own motorcycles" ON public.motorcycles
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can update their own motorcycles" ON public.motorcycles
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

  CREATE POLICY "Users can delete their own motorcycles" ON public.motorcycles
    FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'User-specific schema and policies updated successfully!' as message;