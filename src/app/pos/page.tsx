'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { 
  Category, 
  Product, 
  Deal, 
  Discount, 
  StoreSettings, 
  CartItem, 
  AppliedDiscount,
  Sale,
  PaymentMethod,
  OrderType,
} from '@/types/pos';
import { PosService } from '@/lib/services/posService';
import { createClient } from '@/lib/supabase/client';
import { PosHeader } from '@/components/pos/PosHeader';
import { CategoryNav } from '@/components/pos/CategoryNav';
import { ProductCard } from '@/components/pos/ProductCard';
import { DealCard } from '@/components/pos/DealCard';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { RecentOrdersModal } from '@/components/pos/RecentOrdersModal';
import { Search, Loader2, RotateCcw, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  calcOrderTotals,
  defaultStoreSettings,
  holdCurrentOrder,
  HeldOrder,
  loadHeldOrders,
  removeHeldOrder,
} from '@/lib/pos/helpers';
import { reconnectThermalPrinter } from '@/lib/print/thermalPrinter';

export default function PosPage() {
  const { profile, isAdmin } = useAuth();

  // Master Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings());

  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [tableNo, setTableNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isHeldOpen, setIsHeldOpen] = useState(false);

  // Modals
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch Master Data
  const loadTerminalData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [cats, prods, dls, discs, setts] = await Promise.all([
        PosService.getCategories(true),
        PosService.getProducts(true),
        PosService.getDeals(true),
        PosService.getDiscounts(true),
        PosService.getStoreSettings(),
      ]);

      setCategories(cats);
      setProducts(prods);
      setDeals(dls);
      setDiscounts(discs);
      setSettings(setts);
      void reconnectThermalPrinter(setts.printer_baud_rate);
    } catch (err: any) {
      console.error('Error loading POS terminal data:', err);
      if (!silent) toast.error('Failed to load menu data: ' + err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTerminalData();
    setHeldOrders(loadHeldOrders());
    void reconnectThermalPrinter();

    const supabase = createClient();
    const syncCatalog = () => loadTerminalData(true);
    const channel = supabase
      .channel('pos-catalog-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, syncCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, syncCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, syncCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_items' }, syncCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, syncCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, syncCatalog)
      .subscribe();

    const interval = setInterval(syncCatalog, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Global Cashier Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'F3' && !isPaymentOpen && !isReceiptOpen) {
        e.preventDefault();
        if (cart.length > 0) setIsDiscountOpen(true);
        return;
      }

      if ((e.key === 'F4' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) && !isPaymentOpen && !isReceiptOpen) {
        e.preventDefault();
        if (cart.length > 0) setIsPaymentOpen(true);
        return;
      }

      // If pressing Space when no text input is focused and cart has items, open payment
      if (e.key === ' ' && !isInputFocused && !isPaymentOpen && !isReceiptOpen && !isDiscountOpen && !isRecentOrdersOpen) {
        if (cart.length > 0) {
          e.preventDefault();
          setIsPaymentOpen(true);
        }
      }

      if (e.key === 'Escape') {
        setIsDiscountOpen(false);
        setIsPaymentOpen(false);
        setIsRecentOrdersOpen(false);
        setIsCartOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isPaymentOpen, isReceiptOpen, isDiscountOpen, isRecentOrdersOpen]);

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedDiscount.value) / 100);
    } else {
      discountAmount = Math.min(appliedDiscount.value, subtotal);
    }
  }

  const { taxAmount, serviceChargeAmount, grandTotal } = calcOrderTotals(
    subtotal,
    discountAmount,
    settings
  );

  const resetTicket = () => {
    setCart([]);
    setAppliedDiscount(null);
    setOrderType('takeaway');
    setTableNo('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
  };

  // Cart Actions
  const handleAddProductToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.item_type === 'product' && item.product_id === product.id
      );

      if (existingIdx >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: newQty * updated[existingIdx].unit_price,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          uid: 'prod-' + product.id + '-' + Date.now(),
          item_type: 'product',
          product_id: product.id,
          name: product.name,
          unit_price: product.price,
          quantity: 1,
          total: product.price,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleAddDealToCart = (deal: Deal) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.item_type === 'deal' && item.deal_id === deal.id
      );

      if (existingIdx >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total: newQty * updated[existingIdx].unit_price,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          uid: 'deal-' + deal.id + '-' + Date.now(),
          item_type: 'deal',
          deal_id: deal.id,
          name: deal.name,
          unit_price: deal.price,
          quantity: 1,
          total: deal.price,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQuantity = (uid: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.uid === uid) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unit_price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (uid: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.uid !== uid));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    resetTicket();
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    holdCurrentOrder({
      orderType,
      customerName,
      customerPhone,
      deliveryAddress,
      tableNo,
      cart,
      discount: appliedDiscount,
    });
    setHeldOrders(loadHeldOrders());
    resetTicket();
    toast.success('Order held. Recall it from Held when the customer is ready.');
  };

  const handleRecallHeld = (held: HeldOrder) => {
    if (cart.length > 0) {
      toast.error('Clear or hold the current ticket first');
      return;
    }
    setCart(held.cart);
    setAppliedDiscount(held.discount);
    setOrderType(held.orderType);
    setCustomerName(held.customerName);
    setCustomerPhone(held.customerPhone);
    setDeliveryAddress(held.deliveryAddress);
    setTableNo(held.tableNo);
    removeHeldOrder(held.id);
    setHeldOrders(loadHeldOrders());
    setIsHeldOpen(false);
    toast.success('Held order restored');
  };

  // Process Checkout
  const handleCompleteSale = async ({
    paymentMethod,
    cashReceived,
    changeAmount,
  }: {
    paymentMethod: PaymentMethod;
    cashReceived: number;
    changeAmount: number;
  }) => {
    if (cart.length === 0) return;
    setIsProcessingSale(true);

    try {
      const result = await PosService.completeSale({
        cashierId: profile?.id,
        cashierName: profile?.full_name || 'Counter Cashier',
        subtotal,
        discountAmount,
        discountType: appliedDiscount?.type,
        discountName: appliedDiscount?.name,
        totalAmount: grandTotal,
        paymentMethod,
        cashReceived,
        changeAmount,
        cartItems: cart,
        orderType,
        customerName,
        customerPhone,
        deliveryAddress,
        tableNo,
        taxAmount,
        serviceChargeAmount,
      });

      const saleDetails = await PosService.getSaleById(result.sale_id);
      setCompletedSale(saleDetails);

      setIsPaymentOpen(false);
      setIsCartOpen(false);
      setIsReceiptOpen(true);
      toast.success(
        saleDetails?.token_number
          ? `Token ${saleDetails.token_number} · ${result.invoice_number}`
          : `Completed invoice ${result.invoice_number}`
      );
    } catch (err: any) {
      console.error('Error completing sale:', err);
      toast.error('Transaction failed: ' + err.message);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleStartNewOrder = () => {
    resetTicket();
    setCompletedSale(null);
  };

  // Filtered Products & Deals
  const filteredProducts = products.filter((p) => {
    if (p.category && p.category.is_active === false) return false;

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategoryId === 'all') return true;
    if (selectedCategoryId === 'deals') return false;
    return p.category_id === selectedCategoryId;
  });

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategoryId === 'deals' || selectedCategoryId === 'all') return true;
    return false;
  });

  const getProductCartCount = (productId: string) => {
    const item = cart.find((i) => i.item_type === 'product' && i.product_id === productId);
    return item?.quantity || 0;
  };

  const getDealCartCount = (dealId: string) => {
    const item = cart.find((i) => i.item_type === 'deal' && i.deal_id === dealId);
    return item?.quantity || 0;
  };

  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const openPayment = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const cartProps = {
    cart,
    currency: settings.currency,
    subtotal,
    discount: appliedDiscount,
    taxAmount,
    taxPercent: settings.tax_percent || 0,
    serviceChargeAmount,
    serviceChargePercent: settings.service_charge_percent || 0,
    grandTotal,
    heldCount: heldOrders.length,
    onHoldOrder: handleHoldOrder,
    onOpenHeld: () => setIsHeldOpen(true),
    onUpdateQuantity: handleUpdateQuantity,
    onRemoveItem: handleRemoveItem,
    onClearCart: handleClearCart,
    onOpenDiscountModal: () => setIsDiscountOpen(true),
    onOpenPaymentModal: openPayment,
    orderType,
    onOrderTypeChange: setOrderType,
  };

  return (
    <div className="pos-canvas flex h-dvh flex-col overflow-hidden">
      <PosHeader
        settings={settings}
        onOpenRecentOrders={() => setIsRecentOrdersOpen(true)}
        onFocusSearch={() => searchInputRef.current?.focus()}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CategoryNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id);
              setSearchQuery('');
            }}
            dealsCount={deals.length}
          />

          <div className="flex shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 py-2.5 sm:px-3.5">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
              <input
                ref={searchInputRef}
                type="search"
                enterKeyHint="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu…"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pr-8 pl-10 text-base font-medium transition outline-none placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:ring-3 focus:ring-orange-500/15 md:py-2 md:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full px-1.5 text-xs font-bold text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => loadTerminalData()}
              disabled={loading}
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50"
              title="Refresh Menu"
            >
              <RotateCcw className={cn('size-4', loading && 'animate-spin')} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-4 sm:p-4">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-orange-400">
                <Loader2 className="size-7 animate-spin text-orange-500" />
                <span className="text-sm font-semibold text-stone-600">Loading menu…</span>
              </div>
            ) : filteredProducts.length === 0 && filteredDeals.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <UtensilsCrossed className="size-6" />
                </div>
                <p className="text-sm font-bold text-stone-700">No matching items found</p>
                <p className="text-xs text-stone-500">Try a different search or category.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {(selectedCategoryId === 'deals' || selectedCategoryId === 'all') && filteredDeals.length > 0 && (
                  <div>
                    {selectedCategoryId === 'all' && (
                      <p className="mb-2.5 text-xs font-semibold text-stone-500">Combo Deals</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          currency={settings.currency}
                          onAddDealToCart={handleAddDealToCart}
                          cartQuantity={getDealCartCount(deal.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedCategoryId !== 'deals' && filteredProducts.length > 0 && (
                  <div>
                    {selectedCategoryId === 'all' && filteredDeals.length > 0 && (
                      <p className="mb-2.5 pt-1 text-xs font-semibold text-stone-500">Menu Items</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          currency={settings.currency}
                          onAddToCart={handleAddProductToCart}
                          cartQuantity={getProductCartCount(product.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden h-full lg:flex">
          <CartSidebar {...cartProps} />
        </div>
      </div>

      <div className="safe-bottom shrink-0 border-t border-stone-200 bg-white p-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-left"
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
              <ShoppingBag className="size-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-orange-600 font-mono text-[10px] font-bold text-white">
                  {totalItemCount}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-stone-900">
                {totalItemCount === 0 ? 'Current order' : `${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'}`}
              </span>
              <span className="block truncate text-xs text-stone-500">
                {settings.currency} {grandTotal.toLocaleString()}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={openPayment}
            disabled={cart.length === 0}
            className="flex h-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:bg-stone-300"
          >
            Pay
          </button>
        </div>
      </div>

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[85dvh] max-h-[85dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
        >
          <SheetTitle className="sr-only">Current order</SheetTitle>
          <CartSidebar {...cartProps} className="border-l-0" />
        </SheetContent>
      </Sheet>

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isDiscountOpen}
        onClose={() => setIsDiscountOpen(false)}
        discounts={discounts}
        subtotal={subtotal}
        currency={settings.currency}
        appliedDiscount={appliedDiscount}
        onApplyDiscount={setAppliedDiscount}
        settings={settings}
        isAdmin={isAdmin}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        discountAmount={discountAmount}
        discountName={appliedDiscount?.name}
        taxAmount={taxAmount}
        taxPercent={settings.tax_percent || 0}
        serviceChargeAmount={serviceChargeAmount}
        serviceChargePercent={settings.service_charge_percent || 0}
        totalAmount={grandTotal}
        currency={settings.currency}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        tableNo={tableNo}
        onTableNoChange={setTableNo}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        customerPhone={customerPhone}
        onCustomerPhoneChange={setCustomerPhone}
        deliveryAddress={deliveryAddress}
        onDeliveryAddressChange={setDeliveryAddress}
        onCompleteSale={handleCompleteSale}
        isProcessing={isProcessingSale}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        settings={settings}
        onStartNewOrder={handleStartNewOrder}
      />

      {/* Recent Orders Modal */}
      <RecentOrdersModal
        isOpen={isRecentOrdersOpen}
        onClose={() => setIsRecentOrdersOpen(false)}
        currency={settings.currency}
        settings={settings}
        onViewReceipt={(sale) => {
          setCompletedSale(sale);
          setIsReceiptOpen(true);
        }}
      />

      {isHeldOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/60 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white sm:rounded-2xl">
            <div className="flex items-center justify-between bg-orange-600 px-4 py-3 text-white">
              <h2 className="text-sm font-bold">Held orders</h2>
              <button type="button" onClick={() => setIsHeldOpen(false)} className="rounded-lg p-1 hover:bg-white/15">
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              {heldOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-500">No held tickets.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {heldOrders.map((held) => (
                    <button
                      key={held.id}
                      type="button"
                      onClick={() => handleRecallHeld(held)}
                      className="rounded-xl border border-stone-200 bg-white p-3 text-left hover:border-orange-300"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                        <span className="uppercase">{held.orderType.replace('_', ' ')}</span>
                        <span className="font-mono text-stone-500">
                          {new Date(held.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        {held.cart.reduce((n, i) => n + i.quantity, 0)} items
                        {held.customerPhone ? ` · ${held.customerPhone}` : ''}
                        {held.tableNo ? ` · Table ${held.tableNo}` : ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
