-- Update RLS policies to allow admin operations
-- This script adds INSERT, UPDATE, and DELETE policies for admin functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access on products" ON products;
DROP POLICY IF EXISTS "Allow public read access on business_settings" ON business_settings;

-- Create more permissive policies for admin functionality
-- Categories policies
CREATE POLICY "Allow all operations on categories" ON categories
    FOR ALL USING (true) WITH CHECK (true);

-- Products policies  
CREATE POLICY "Allow all operations on products" ON products
    FOR ALL USING (true) WITH CHECK (true);

-- Business settings policies
CREATE POLICY "Allow all operations on business_settings" ON business_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Note: In a production environment, you would want to restrict these policies
-- to authenticated admin users only. For this demo app, we're allowing all operations.
