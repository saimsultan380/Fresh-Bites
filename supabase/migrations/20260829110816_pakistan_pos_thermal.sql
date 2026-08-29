-- Pakistani POS fields, extra payment methods, daily tokens, thermal printer settings

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS ntn TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS strn TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tax_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_charge_percent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paper_width_mm INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS auto_print BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_cut BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cut_mode TEXT NOT NULL DEFAULT 'partial',
  ADD COLUMN IF NOT EXISTS feed_lines_before_cut INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS print_copies INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS print_kitchen_copy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS open_cash_drawer BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS printer_connection TEXT NOT NULL DEFAULT 'escpos',
  ADD COLUMN IF NOT EXISTS printer_baud_rate INTEGER NOT NULL DEFAULT 9600;

ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_paper_width_mm_check;
ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_paper_width_mm_check CHECK (paper_width_mm IN (58, 80));

ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_cut_mode_check;
ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_cut_mode_check CHECK (cut_mode IN ('full', 'partial'));

ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_printer_connection_check;
ALTER TABLE store_settings
  ADD CONSTRAINT store_settings_printer_connection_check CHECK (printer_connection IN ('escpos', 'browser'));

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'takeaway',
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS table_no TEXT,
  ADD COLUMN IF NOT EXISTS token_number INTEGER,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_charge_amount NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_order_type_check;
ALTER TABLE sales
  ADD CONSTRAINT sales_order_type_check CHECK (order_type IN ('dine_in', 'takeaway', 'delivery'));

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales
  ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'jazzcash', 'easypaisa', 'bank', 'other'));

CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales (created_at DESC);
CREATE INDEX IF NOT EXISTS sales_token_day_idx ON sales ((timezone('Asia/Karachi', created_at)::date), token_number);

DROP FUNCTION IF EXISTS process_sale_transaction(uuid, text, numeric, numeric, text, text, numeric, text, numeric, numeric, jsonb);

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
  p_items JSONB,
  p_order_type TEXT DEFAULT 'takeaway',
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_table_no TEXT DEFAULT NULL,
  p_tax_amount NUMERIC DEFAULT 0,
  p_service_charge_amount NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_sale_id UUID;
  v_invoice_number TEXT;
  v_item JSONB;
  v_created_at TIMESTAMPTZ := now();
  v_token INTEGER;
  v_order_type TEXT := COALESCE(NULLIF(p_order_type, ''), 'takeaway');
BEGIN
  IF v_order_type NOT IN ('dine_in', 'takeaway', 'delivery') THEN
    v_order_type := 'takeaway';
  END IF;

  SELECT COALESCE(MAX(token_number), 0) + 1
  INTO v_token
  FROM sales
  WHERE timezone('Asia/Karachi', created_at)::date = timezone('Asia/Karachi', v_created_at)::date;

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
    order_type,
    customer_name,
    customer_phone,
    delivery_address,
    table_no,
    token_number,
    tax_amount,
    service_charge_amount,
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
    v_order_type,
    NULLIF(p_customer_name, ''),
    NULLIF(p_customer_phone, ''),
    NULLIF(p_delivery_address, ''),
    NULLIF(p_table_no, ''),
    v_token,
    COALESCE(p_tax_amount, 0),
    COALESCE(p_service_charge_amount, 0),
    v_created_at,
    v_created_at
  ) RETURNING id INTO v_sale_id;

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
    'token_number', v_token,
    'created_at', v_created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_sale_transaction(
  uuid, text, numeric, numeric, text, text, numeric, text, numeric, numeric, jsonb, text, text, text, text, text, numeric, numeric
) TO anon, authenticated, service_role;
