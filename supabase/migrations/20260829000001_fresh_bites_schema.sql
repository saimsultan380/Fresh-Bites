-- Fresh Bites POS Schema & Initialization Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier')),
  pin_code TEXT DEFAULT '1234',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Fresh Bites',
  tagline TEXT DEFAULT 'Eat Fresh, Feel Fresh',
  logo_url TEXT,
  address TEXT DEFAULT 'Commercial Area, Main Boulevard',
  phone TEXT DEFAULT '+92 300 1234567',
  currency TEXT DEFAULT 'PKR',
  receipt_footer TEXT DEFAULT 'Thank You For Your Order!',
  max_cashier_discount_percent NUMERIC DEFAULT 10,
  admin_pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PRODUCT PRICE HISTORY
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DEALS
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DEAL ITEMS
CREATE TABLE IF NOT EXISTS deal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

-- 8. DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value >= 0),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. SALES & INVOICE SEQUENCE
CREATE SEQUENCE IF NOT EXISTS sale_invoice_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  seq_num BIGINT;
BEGIN
  seq_num := nextval('sale_invoice_seq');
  RETURN 'FB-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT generate_invoice_number(),
  cashier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cashier_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_type TEXT,
  discount_name TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'other')),
  cash_received NUMERIC NOT NULL DEFAULT 0 CHECK (cash_received >= 0),
  change_amount NUMERIC NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'refunded')),
  voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'deal')),
  product_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  cash_received NUMERIC DEFAULT 0,
  change_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PRICE HISTORY TRIGGER
CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO product_price_history (product_id, old_price, new_price, created_at)
    VALUES (NEW.id, OLD.price, NEW.price, now());
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_price_change ON products;
CREATE TRIGGER tr_product_price_change
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_price_change();

-- ATOMIC SALE CHECKOUT RPC
CREATE OR REPLACE FUNCTION process_sale_transaction(
  p_cashier_id UUID,
  p_cashier_name TEXT,
  p_subtotal NUMERIC,
  p_discount_amount NUMERIC,
  p_discount_type TEXT,
  p_discount_name TEXT,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_cash_received NUMERIC,
  p_change_amount NUMERIC,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_sale_id UUID;
  v_invoice_number TEXT;
  v_item JSONB;
  v_created_at TIMESTAMPTZ := now();
BEGIN
  v_invoice_number := generate_invoice_number();

  INSERT INTO sales (
    invoice_number,
    cashier_id,
    cashier_name,
    subtotal,
    discount_amount,
    discount_type,
    discount_name,
    total_amount,
    payment_method,
    cash_received,
    change_amount,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_number,
    p_cashier_id,
    p_cashier_name,
    p_subtotal,
    p_discount_amount,
    p_discount_type,
    p_discount_name,
    p_total_amount,
    p_payment_method,
    p_cash_received,
    p_change_amount,
    'completed',
    v_created_at,
    v_created_at
  ) RETURNING id INTO v_sale_id;

  -- Insert sale items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO sale_items (
      sale_id,
      product_id,
      deal_id,
      item_type,
      product_name,
      unit_price,
      quantity,
      discount_amount,
      total,
      notes,
      created_at
    ) VALUES (
      v_sale_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL THEN (v_item->>'product_id')::UUID ELSE NULL END,
      CASE WHEN v_item->>'deal_id' IS NOT NULL THEN (v_item->>'deal_id')::UUID ELSE NULL END,
      COALESCE(v_item->>'item_type', 'product'),
      v_item->>'product_name',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'quantity')::INTEGER,
      COALESCE((v_item->>'discount_amount')::NUMERIC, 0),
      (v_item->>'total')::NUMERIC,
      v_item->>'notes',
      v_created_at
    );
  END LOOP;

  -- Insert payment record
  INSERT INTO payments (
    sale_id,
    payment_method,
    amount,
    cash_received,
    change_amount,
    created_at
  ) VALUES (
    v_sale_id,
    p_payment_method,
    p_total_amount,
    p_cash_received,
    p_change_amount,
    v_created_at
  );

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'invoice_number', v_invoice_number,
    'created_at', v_created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Base Public / Authenticated read policies for POS operation
CREATE POLICY "Allow public read on store_settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage store_settings" ON store_settings FOR ALL USING (true);

CREATE POLICY "Allow read active categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow manage categories" ON categories FOR ALL USING (true);

CREATE POLICY "Allow read active products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow manage products" ON products FOR ALL USING (true);

CREATE POLICY "Allow read price history" ON product_price_history FOR SELECT USING (true);
CREATE POLICY "Allow manage price history" ON product_price_history FOR ALL USING (true);

CREATE POLICY "Allow read deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Allow manage deals" ON deals FOR ALL USING (true);

CREATE POLICY "Allow read deal items" ON deal_items FOR SELECT USING (true);
CREATE POLICY "Allow manage deal items" ON deal_items FOR ALL USING (true);

CREATE POLICY "Allow read discounts" ON discounts FOR SELECT USING (true);
CREATE POLICY "Allow manage discounts" ON discounts FOR ALL USING (true);

CREATE POLICY "Allow read sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update sales" ON sales FOR UPDATE USING (true);

CREATE POLICY "Allow read sale items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Allow insert sale items" ON sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow insert payments" ON payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow manage profiles" ON profiles FOR ALL USING (true);

-- SEED INITIAL DATA
INSERT INTO store_settings (business_name, tagline, address, phone, currency, receipt_footer, max_cashier_discount_percent, admin_pin)
SELECT 'Fresh Bites', 'Eat Fresh, Feel Fresh', 'Commercial Area, Main Boulevard', '+92 300 1234567', 'PKR', 'Thank You For Your Order!', 10, '1234'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Seed Categories
INSERT INTO categories (id, name, slug, sort_order, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111101', 'Burgers', 'burgers', 1, true),
  ('11111111-1111-1111-1111-111111111102', 'Fried Chicken', 'fried-chicken', 2, true),
  ('11111111-1111-1111-1111-111111111103', 'Wings & Nuggets', 'wings-nuggets', 3, true),
  ('11111111-1111-1111-1111-111111111104', 'Fries & Sides', 'fries-sides', 4, true),
  ('11111111-1111-1111-1111-111111111105', 'Drinks & Juices', 'drinks-juices', 5, true),
  ('11111111-1111-1111-1111-111111111106', 'Combo Deals', 'deals', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO products (id, name, description, category_id, price, is_active)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'Zinger Burger', 'Signature crispy fried chicken fillet burger with fresh lettuce and mayo', '11111111-1111-1111-1111-111111111101', 290, true),
  ('22222222-2222-2222-2222-222222222202', 'Patty Burger', 'Juicy grilled beef/chicken patty burger with cheddar and sauce', '11111111-1111-1111-1111-111111111101', 220, true),
  ('22222222-2222-2222-2222-222222222203', 'Chicken Burger', 'Tender crumb-coated chicken burger with fresh iceberg', '11111111-1111-1111-1111-111111111101', 300, true),
  ('22222222-2222-2222-2222-222222222204', 'Crispy Chicken', 'Deep fried golden crispy chicken piece', '11111111-1111-1111-1111-111111111102', 230, true),
  ('22222222-2222-2222-2222-222222222205', 'Drumstick', 'Golden spiced crispy fried drumstick piece', '11111111-1111-1111-1111-111111111102', 180, true),
  ('22222222-2222-2222-2222-222222222206', 'Hot Wings (6 Pcs)', '6 pieces of spicy coated fried hot wings', '11111111-1111-1111-1111-111111111103', 320, true),
  ('22222222-2222-2222-2222-222222222207', 'Chicken Nuggets (6 Pcs)', '6 pieces golden tender chicken nuggets with dip', '11111111-1111-1111-1111-111111111103', 250, true),
  ('22222222-2222-2222-2222-222222222208', 'Regular French Fries', 'Crispy salted potato fries', '11111111-1111-1111-1111-111111111104', 150, true),
  ('22222222-2222-2222-2222-222222222209', 'Large French Fries', 'Large portion crispy salted potato fries', '11111111-1111-1111-1111-111111111104', 220, true),
  ('22222222-2222-2222-2222-222222222210', 'Coke Buddy', 'Fresh cold Coke 300ml bottle', '11111111-1111-1111-1111-111111111105', 80, true),
  ('22222222-2222-2222-2222-222222222211', 'Coke 1 Liter', 'Chilled 1L Coke bottle', '11111111-1111-1111-1111-111111111105', 160, true),
  ('22222222-2222-2222-2222-222222222212', 'Coke 2 Liter', 'Chilled 2L Coke bottle', '11111111-1111-1111-1111-111111111105', 260, true),
  ('22222222-2222-2222-2222-222222222213', 'Mineral Water 500ml', 'Chilled pure mineral water', '11111111-1111-1111-1111-111111111105', 60, true),
  ('22222222-2222-2222-2222-222222222214', 'Fresh Orange Juice', '100% natural freshly squeezed orange juice', '11111111-1111-1111-1111-111111111105', 190, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Combo Deals
INSERT INTO deals (id, name, description, price, is_active)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'Deal 1: Zinger Duo Combo', '1 × Zinger Burger, 1 × Drumstick, 1 × Buddy Drink', 490, true),
  ('33333333-3333-3333-3333-333333333302', 'Deal 2: Feast Combo', '2 × Zinger Burgers, 1 × Regular Fries, 1 × 1L Coke', 790, true)
ON CONFLICT (id) DO NOTHING;

-- Deal Items Linkage
INSERT INTO deal_items (deal_id, product_id, quantity)
VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 1),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222205', 1),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222210', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 2),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222208', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222211', 1)
ON CONFLICT DO NOTHING;

-- Seed Discounts
INSERT INTO discounts (id, name, type, value, is_active)
VALUES
  ('44444444-4444-4444-4444-444444444401', '10% Counter Discount', 'percentage', 10, true),
  ('44444444-4444-4444-4444-444444444402', '15% Promo Discount', 'percentage', 15, true),
  ('44444444-4444-4444-4444-444444444403', 'Rs. 50 Flat Off', 'fixed', 50, true),
  ('44444444-4444-4444-4444-444444444404', 'Rs. 100 Flat Off', 'fixed', 100, true)
ON CONFLICT (id) DO NOTHING;
