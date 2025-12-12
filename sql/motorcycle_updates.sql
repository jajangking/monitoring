-- SQL updates needed for Supabase database to support motorcycle functionality
-- These commands need to be run in your Supabase SQL editor

-- Add motorcycle_id column to oil_changes table
ALTER TABLE public.oil_changes ADD COLUMN IF NOT EXISTS motorcycle_id UUID;

-- Add motorcycle_id column to spareparts table
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS motorcycle_id UUID;

-- Add motorcycle_id column to daily_mileage table (for kilometer monitoring per motorcycle)
ALTER TABLE public.daily_mileage ADD COLUMN IF NOT EXISTS motorcycle_id UUID;

-- Create motorcycles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.motorcycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    license_plate TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to describe the new columns
COMMENT ON COLUMN public.oil_changes.motorcycle_id IS 'Foreign key to associate oil changes with specific motorcycles';
COMMENT ON COLUMN public.spareparts.motorcycle_id IS 'Foreign key to associate spare parts with specific motorcycles';
COMMENT ON COLUMN public.daily_mileage.motorcycle_id IS 'Foreign key to associate daily mileage records with specific motorcycles';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_oil_changes_motorcycle_id ON public.oil_changes(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_spareparts_motorcycle_id ON public.spareparts(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_daily_mileage_motorcycle_id ON public.daily_mileage(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_at ON public.motorcycles(created_at);

-- Optional: Add foreign key constraints (requires the referenced records to exist)
-- This would ensure data integrity but may cause issues if existing motorcycle_id values don't match records
/*
ALTER TABLE public.oil_changes
ADD CONSTRAINT fk_oil_changes_motorcycle_id
FOREIGN KEY (motorcycle_id) REFERENCES public.motorcycles(id)
ON DELETE SET NULL;

ALTER TABLE public.spareparts
ADD CONSTRAINT fk_spareparts_motorcycle_id
FOREIGN KEY (motorcycle_id) REFERENCES public.motorcycles(id)
ON DELETE SET NULL;

ALTER TABLE public.daily_mileage
ADD CONSTRAINT fk_daily_mileage_motorcycle_id
FOREIGN KEY (motorcycle_id) REFERENCES public.motorcycles(id)
ON DELETE SET NULL;
*/

-- Optional: Create RLS policies for row-level security (if needed)
-- This is useful if you want to ensure users can only access their own motorcycle data
/*
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_mileage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own motorcycles" ON public.motorcycles
  FOR SELECT USING (auth.uid() = id OR true); -- Adjust based on your auth requirements

CREATE POLICY "Users can view oil changes for their motorcycles" ON public.oil_changes
  FOR SELECT USING (true); -- Adjust based on your auth requirements
*/