import { AppliedDiscount, CartItem, OrderType, StoreSettings } from '@/types/pos';

const KEY = 'fb-held-orders';

export interface HeldOrder {
  id: string;
  createdAt: string;
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  tableNo: string;
  cart: CartItem[];
  discount: AppliedDiscount | null;
}

export function loadHeldOrders(): HeldOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HeldOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveHeldOrders(orders: HeldOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function holdCurrentOrder(order: Omit<HeldOrder, 'id' | 'createdAt'>): HeldOrder {
  const held: HeldOrder = {
    ...order,
    id: `hold-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  saveHeldOrders([held, ...loadHeldOrders()].slice(0, 20));
  return held;
}

export function removeHeldOrder(id: string) {
  saveHeldOrders(loadHeldOrders().filter((o) => o.id !== id));
}

export function defaultStoreSettings(): StoreSettings {
  return {
    id: 'default',
    business_name: 'Fresh Bites',
    address: 'Dolat Gate Metro Station',
    phone: '0327-7373127, 0303-9778740',
    currency: 'PKR',
    receipt_footer: 'Thank You For Your Order!',
    max_cashier_discount_percent: 10,
    admin_pin: '1234',
    ntn: '',
    strn: '',
    tax_percent: 0,
    service_charge_percent: 0,
    paper_width_mm: 80,
    auto_print: true,
    auto_cut: true,
    cut_mode: 'partial',
    feed_lines_before_cut: 4,
    print_copies: 1,
    print_kitchen_copy: false,
    open_cash_drawer: true,
    printer_connection: 'escpos',
    printer_baud_rate: 9600,
    created_at: '',
    updated_at: '',
  };
}

export function normalizeStoreSettings(row: Partial<StoreSettings> | null | undefined): StoreSettings {
  const base = defaultStoreSettings();
  if (!row) return base;
  return {
    ...base,
    ...row,
    tax_percent: Number(row.tax_percent ?? 0),
    service_charge_percent: Number(row.service_charge_percent ?? 0),
    paper_width_mm: row.paper_width_mm === 58 ? 58 : 80,
    auto_print: row.auto_print !== false,
    auto_cut: row.auto_cut !== false,
    cut_mode: row.cut_mode === 'full' ? 'full' : 'partial',
    feed_lines_before_cut: Number(row.feed_lines_before_cut ?? 4),
    print_copies: Math.max(1, Number(row.print_copies ?? 1)),
    print_kitchen_copy: !!row.print_kitchen_copy,
    open_cash_drawer: row.open_cash_drawer !== false,
    printer_connection: row.printer_connection === 'browser' ? 'browser' : 'escpos',
    printer_baud_rate: Number(row.printer_baud_rate ?? 9600),
  };
}

export function calcOrderTotals(
  subtotal: number,
  discountAmount: number,
  settings: StoreSettings
) {
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((afterDiscount * (Number(settings.tax_percent) || 0)) / 100);
  const serviceChargeAmount = Math.round(
    (afterDiscount * (Number(settings.service_charge_percent) || 0)) / 100
  );
  const grandTotal = afterDiscount + taxAmount + serviceChargeAmount;
  return { afterDiscount, taxAmount, serviceChargeAmount, grandTotal };
}
