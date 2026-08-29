-- Update store settings with new Dolat Gate address, phone numbers and 7 Gen Marketing credit
UPDATE store_settings
SET 
  address = 'Dolat Gate Metro Station',
  phone = '0327-7373127, 0303-9778740',
  receipt_footer = 'Thank You For Your Order!',
  updated_at = now();
