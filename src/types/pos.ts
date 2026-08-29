export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  pin_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaperWidthMm = 58 | 80;
export type CutMode = 'full' | 'partial';
export type PrinterConnection = 'escpos' | 'browser';

export interface StoreSettings {
  id: string;
  business_name: string;
  tagline?: string;
  logo_url?: string;
  address: string;
  phone: string;
  currency: string;
  receipt_footer: string;
  max_cashier_discount_percent: number;
  admin_pin: string;
  ntn?: string;
  strn?: string;
  tax_percent: number;
  service_charge_percent: number;
  paper_width_mm: PaperWidthMm;
  auto_print: boolean;
  auto_cut: boolean;
  cut_mode: CutMode;
  feed_lines_before_cut: number;
  print_copies: number;
  print_kitchen_copy: boolean;
  open_cash_drawer: boolean;
  printer_connection: PrinterConnection;
  printer_baud_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category_id: string | null;
  category?: Category | null;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  changed_by?: string | null;
  changer_profile?: { full_name: string } | null;
  created_at: string;
}

export interface DealItem {
  id: string;
  deal_id: string;
  product_id: string;
  product?: Product | null;
  quantity: number;
}

export interface Deal {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  is_active: boolean;
  deal_items?: DealItem[];
  created_at: string;
  updated_at: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export type SaleStatus = 'completed' | 'voided' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'jazzcash' | 'easypaisa' | 'bank' | 'other';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string | null;
  deal_id?: string | null;
  item_type: 'product' | 'deal';
  product_name: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  total: number;
  notes?: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  cashier_id?: string | null;
  cashier_name?: string | null;
  cashier?: Profile | null;
  subtotal: number;
  discount_amount: number;
  discount_type?: string | null;
  discount_name?: string | null;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_received: number;
  change_amount: number;
  order_type: OrderType;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  table_no?: string | null;
  token_number?: number | null;
  tax_amount: number;
  service_charge_amount: number;
  status: SaleStatus;
  voided_by?: string | null;
  void_reason?: string | null;
  voided_at?: string | null;
  created_at: string;
  updated_at: string;
  sale_items?: SaleItem[];
}

export interface CartItem {
  uid: string; // Unique cart line identifier
  item_type: 'product' | 'deal';
  product_id?: string;
  deal_id?: string;
  name: string;
  unit_price: number;
  quantity: number;
  total: number;
  notes?: string;
}

export interface AppliedDiscount {
  id?: string;
  name: string;
  type: DiscountType;
  value: number;
  calculatedAmount: number;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  averageOrderValue: number;
  todayDiscount: number;
  yesterdaySales: number;
  weeklySales: number;
  monthlySales: number;
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
  recentSales: Sale[];
  salesByDay: { date: string; sales: number; orders: number }[];
}
