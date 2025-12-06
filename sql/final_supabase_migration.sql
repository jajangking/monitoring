-- Supabase Schema for Monitoring App
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist
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

-- Create indexes
CREATE INDEX idx_orders_date ON orders (date DESC);
CREATE INDEX idx_fuel_expenses_date ON fuel_expenses (date DESC);
CREATE INDEX idx_oil_changes_date ON oil_changes (date DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oil_changes ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Allow all access to orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all access to fuel_expenses" ON public.fuel_expenses FOR ALL USING (true);
CREATE POLICY "Allow all access to oil_changes" ON public.oil_changes FOR ALL USING (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE public.orders TO anon;
GRANT ALL PRIVILEGES ON TABLE public.orders TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.fuel_expenses TO anon;
GRANT ALL PRIVILEGES ON TABLE public.fuel_expenses TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.oil_changes TO anon;
GRANT ALL PRIVILEGES ON TABLE public.oil_changes TO service_role;

-- Add triggers for auto timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_expenses_updated_at 
  BEFORE UPDATE ON fuel_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oil_changes_updated_at 
  BEFORE UPDATE ON oil_changes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Tables created successfully!' as message;