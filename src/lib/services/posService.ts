import { createClient } from '@/lib/supabase/client';
import { 
  Category, 
  Product, 
  Deal, 
  Discount, 
  StoreSettings, 
  Sale, 
  CartItem, 
  DashboardStats,
  Profile,
  PaymentMethod,
  OrderType,
} from '@/types/pos';
import { normalizeStoreSettings } from '@/lib/pos/helpers';

export class PosService {
  private static supabase = createClient();

  // STORE SETTINGS
  static async getStoreSettings(): Promise<StoreSettings> {
    const { data, error } = await this.supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      return normalizeStoreSettings(null);
    }
    return normalizeStoreSettings(data);
  }

  static async updateStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const { data: existing } = await this.supabase.from('store_settings').select('id').limit(1).single();
    if (existing) {
      const { data, error } = await this.supabase
        .from('store_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return normalizeStoreSettings(data);
    } else {
      const { data, error } = await this.supabase
        .from('store_settings')
        .insert(settings)
        .select()
        .single();
      if (error) throw error;
      return normalizeStoreSettings(data);
    }
  }

  // CATEGORIES
  static async getCategories(activeOnly = false): Promise<Category[]> {
    let query = this.supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  // PRODUCTS
  static async getProducts(activeOnly = false): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      price: Number(p.price)
    }));
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    return { ...data, price: Number(data.price) };
  }

  static async updateProduct(id: string, updates: Partial<Product>, changedByUserId?: string): Promise<Product> {
    const current = await this.supabase.from('products').select('price').eq('id', id).single();

    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    delete payload.category;

    const { data, error } = await this.supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;

    if (
      changedByUserId &&
      updates.price !== undefined &&
      current.data &&
      Number(current.data.price) !== Number(updates.price)
    ) {
      const { data: latest } = await this.supabase
        .from('product_price_history')
        .select('id')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.id) {
        await this.supabase
          .from('product_price_history')
          .update({ changed_by: changedByUserId })
          .eq('id', latest.id);
      }
    }

    return { ...data, price: Number(data.price) };
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  static async getProductPriceHistory(productId: string) {
    const { data, error } = await this.supabase
      .from('product_price_history')
      .select('*, changer_profile:profiles(full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // DEALS
  static async getDeals(activeOnly = false): Promise<Deal[]> {
    let query = this.supabase
      .from('deals')
      .select('*, deal_items(*, product:products(*))')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      price: Number(d.price)
    }));
  }

  static async createDeal(deal: { name: string; description?: string; price: number; is_active: boolean; items: { product_id: string; quantity: number }[] }): Promise<Deal> {
    const { data: newDeal, error: dealError } = await this.supabase
      .from('deals')
      .insert({
        name: deal.name,
        description: deal.description,
        price: deal.price,
        is_active: deal.is_active,
      })
      .select()
      .single();
    if (dealError) throw dealError;

    if (deal.items && deal.items.length > 0) {
      const dealItemsPayload = deal.items.map(item => ({
        deal_id: newDeal.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const { error: itemsError } = await this.supabase.from('deal_items').insert(dealItemsPayload);
      if (itemsError) throw itemsError;
    }

    return this.getDealById(newDeal.id);
  }

  static async updateDeal(id: string, deal: { name?: string; description?: string; price?: number; is_active?: boolean; items?: { product_id: string; quantity: number }[] }): Promise<Deal> {
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (deal.name !== undefined) updatePayload.name = deal.name;
    if (deal.description !== undefined) updatePayload.description = deal.description;
    if (deal.price !== undefined) updatePayload.price = deal.price;
    if (deal.is_active !== undefined) updatePayload.is_active = deal.is_active;

    const { error: dealError } = await this.supabase
      .from('deals')
      .update(updatePayload)
      .eq('id', id);
    if (dealError) throw dealError;

    if (deal.items !== undefined) {
      await this.supabase.from('deal_items').delete().eq('deal_id', id);
      if (deal.items.length > 0) {
        const dealItemsPayload = deal.items.map(item => ({
          deal_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
        }));
        await this.supabase.from('deal_items').insert(dealItemsPayload);
      }
    }

    return this.getDealById(id);
  }

  static async deleteDeal(id: string): Promise<void> {
    const { error } = await this.supabase.from('deals').delete().eq('id', id);
    if (error) throw error;
  }

  static async getDealById(id: string): Promise<Deal> {
    const { data, error } = await this.supabase
      .from('deals')
      .select('*, deal_items(*, product:products(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { ...data, price: Number(data.price) };
  }

  // DISCOUNTS
  static async getDiscounts(activeOnly = false): Promise<Discount[]> {
    let query = this.supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      value: Number(d.value)
    }));
  }

  static async createDiscount(discount: Omit<Discount, 'id' | 'created_at'>): Promise<Discount> {
    const { data, error } = await this.supabase
      .from('discounts')
      .insert(discount)
      .select()
      .single();
    if (error) throw error;
    return { ...data, value: Number(data.value) };
  }

  static async updateDiscount(id: string, updates: Partial<Discount>): Promise<Discount> {
    const { data, error } = await this.supabase
      .from('discounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, value: Number(data.value) };
  }

  static async deleteDiscount(id: string): Promise<void> {
    const { error } = await this.supabase.from('discounts').delete().eq('id', id);
    if (error) throw error;
  }

  // CHECKOUT / COMPLETE SALE (Online PostgreSQL Transaction)
  static async completeSale(params: {
    cashierId?: string;
    cashierName: string;
    subtotal: number;
    discountAmount: number;
    discountType?: string;
    discountName?: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    cashReceived: number;
    changeAmount: number;
    cartItems: CartItem[];
    orderType: OrderType;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    tableNo?: string;
    taxAmount?: number;
    serviceChargeAmount?: number;
  }): Promise<{ sale_id: string; invoice_number: string; token_number?: number; created_at: string }> {
    const itemsPayload = params.cartItems.map(item => ({
      product_id: item.product_id || null,
      deal_id: item.deal_id || null,
      item_type: item.item_type,
      product_name: item.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      discount_amount: 0,
      total: item.total,
      notes: item.notes || null,
    }));

    const { data, error } = await this.supabase.rpc('process_sale_transaction', {
      p_cashier_id: params.cashierId || null,
      p_cashier_name: params.cashierName,
      p_subtotal: params.subtotal,
      p_discount_amount: params.discountAmount,
      p_discount_type: params.discountType || null,
      p_discount_name: params.discountName || null,
      p_total_amount: params.totalAmount,
      p_payment_method: params.paymentMethod,
      p_cash_received: params.cashReceived,
      p_change_amount: params.changeAmount,
      p_items: itemsPayload,
      p_order_type: params.orderType || 'takeaway',
      p_customer_name: params.customerName || null,
      p_customer_phone: params.customerPhone || null,
      p_delivery_address: params.deliveryAddress || null,
      p_table_no: params.tableNo || null,
      p_tax_amount: params.taxAmount || 0,
      p_service_charge_amount: params.serviceChargeAmount || 0,
    });

    if (error) {
      console.error('RPC Error processing sale:', error);
      throw new Error(error.message || 'Failed to complete sale transaction');
    }

    return data;
  }

  // SALES HISTORY & AUDIT
  static async getSales(filters?: {
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    invoiceNumber?: string;
  }): Promise<Sale[]> {
    let query = this.supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.invoiceNumber) {
      query = query.ilike('invoice_number', `%${filters.invoiceNumber}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapSale);
  }

  static async getSaleById(id: string): Promise<Sale | null> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapSale(data);
  }

  static async voidSale(id: string, voidedBy: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('sales')
      .update({
        status: 'voided',
        voided_by: voidedBy,
        void_reason: reason,
        voided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  }

  // DASHBOARD ANALYTICS & REPORTS
  static async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    // Fetch sales for last 30 days
    const { data: salesData, error } = await this.supabase
      .from('sales')
      .select('*, sale_items(*)')
      .gte('created_at', thirtyDaysAgoIso)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const allSales = (salesData || []).map(mapSale);

    const validSales = allSales.filter(s => s.status === 'completed');

    // Today sales
    const todaySalesList = validSales.filter(s => new Date(s.created_at) >= today);
    const todaySales = todaySalesList.reduce((acc, s) => acc + s.total_amount, 0);
    const todayOrders = todaySalesList.length;
    const averageOrderValue = todayOrders > 0 ? Math.round(todaySales / todayOrders) : 0;
    const todayDiscount = todaySalesList.reduce((acc, s) => acc + s.discount_amount, 0);

    // Yesterday sales
    const yesterdaySalesList = validSales.filter(
      s => new Date(s.created_at) >= yesterday && new Date(s.created_at) < today
    );
    const yesterdaySales = yesterdaySalesList.reduce((acc, s) => acc + s.total_amount, 0);

    // Weekly sales
    const weeklySalesList = validSales.filter(s => new Date(s.created_at) >= sevenDaysAgo);
    const weeklySales = weeklySalesList.reduce((acc, s) => acc + s.total_amount, 0);

    // Monthly sales
    const monthlySales = validSales.reduce((acc, s) => acc + s.total_amount, 0);

    // Top selling items
    const productStatsMap: { [name: string]: { quantity: number; revenue: number } } = {};
    validSales.forEach(s => {
      s.sale_items?.forEach((item: any) => {
        if (!productStatsMap[item.product_name]) {
          productStatsMap[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productStatsMap[item.product_name].quantity += item.quantity;
        productStatsMap[item.product_name].revenue += item.total;
      });
    });

    const topSellingProducts = Object.entries(productStatsMap)
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    // Sales by day for chart (last 7 days)
    const salesByDayMap: { [dateStr: string]: { sales: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesByDayMap[key] = { sales: 0, orders: 0 };
    }

    weeklySalesList.forEach(s => {
      const key = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (salesByDayMap[key]) {
        salesByDayMap[key].sales += s.total_amount;
        salesByDayMap[key].orders += 1;
      }
    });

    const salesByDay = Object.entries(salesByDayMap).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders,
    }));

    return {
      todaySales,
      todayOrders,
      averageOrderValue,
      todayDiscount,
      yesterdaySales,
      weeklySales,
      monthlySales,
      topSellingProducts,
      recentSales: allSales.slice(0, 10),
      salesByDay,
    };
  }

  // PROFILES / STAFF
  static async getProfiles(): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

function mapSale(s: any): Sale {
  return {
    ...s,
    subtotal: Number(s.subtotal),
    discount_amount: Number(s.discount_amount),
    total_amount: Number(s.total_amount),
    cash_received: Number(s.cash_received),
    change_amount: Number(s.change_amount),
    tax_amount: Number(s.tax_amount || 0),
    service_charge_amount: Number(s.service_charge_amount || 0),
    order_type: s.order_type || 'takeaway',
    token_number: s.token_number != null ? Number(s.token_number) : null,
    sale_items: (s.sale_items || []).map((si: any) => ({
      ...si,
      unit_price: Number(si.unit_price),
      discount_amount: Number(si.discount_amount),
      total: Number(si.total),
    })),
  };
}
