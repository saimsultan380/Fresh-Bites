'use client';

import React, { useState, useEffect } from 'react';
import { Sale, StoreSettings } from '@/types/pos';
import { PosService } from '@/lib/services/posService';
import { History, Search, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecentOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  settings: StoreSettings;
  onViewReceipt: (sale: Sale) => void;
}

export function RecentOrdersModal({
  isOpen,
  onClose,
  currency,
  settings,
  onViewReceipt,
}: RecentOrdersModalProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecentSales();
    }
  }, [isOpen]);

  const loadRecentSales = async () => {
    setLoading(true);
    try {
      const data = await PosService.getSales({ limit: 20 });
      setSales(data);
    } catch (err: any) {
      toast.error('Failed to load recent orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredSales = sales.filter((s) =>
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.cashier_name && s.cashier_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between bg-stone-900 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <History className="size-5" />
            <h2 className="text-base font-extrabold tracking-tight">Recent POS Orders</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-stone-200 bg-stone-50 p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by invoice or cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pr-4 pl-9 text-xs font-medium outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500">Loading recent transactions...</div>
          ) : filteredSales.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">No orders found.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition hover:bg-stone-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-950">
                        {sale.invoice_number}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {sale.status}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.cashier_name || 'Cashier'} • {sale.payment_method ? sale.payment_method.replace('_', ' ') : ''}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[11px] font-medium text-stone-600">
                      {sale.sale_items?.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm font-black text-stone-950">
                        <span className="mr-0.5 text-[10px] font-bold text-stone-400">{currency}</span>
                        {sale.total_amount.toLocaleString()}
                      </div>
                      {sale.discount_amount > 0 && (
                        <div className="text-[10px] font-semibold text-emerald-700">
                          Disc: {currency} {sale.discount_amount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewReceipt(sale);
                      }}
                      className="rounded-lg bg-stone-100 p-2 text-stone-700 transition hover:bg-orange-500 hover:text-white"
                      title="View & Reprint Receipt"
                    >
                      <Printer className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
