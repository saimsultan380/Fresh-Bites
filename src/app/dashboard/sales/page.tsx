'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { Sale, StoreSettings } from '@/types/pos';
import { useAuth } from '@/lib/auth/authContext';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import {
  Search,
  Receipt,
  Printer,
  Ban,
  Eye,
  Calendar,
  Filter,
  Loader2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { defaultStoreSettings } from '@/lib/pos/helpers';
import { PAYMENT_METHODS, paymentMethodLabel, matchesPaymentFilter } from '@/lib/constants/payments';

export default function SalesHistoryPage() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInvoice, setSearchInvoice] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Detail & Void Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const [salesData, setts] = await Promise.all([
        PosService.getSales({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        PosService.getStoreSettings(),
      ]);
      setSales(salesData);
      setSettings(setts);
    } catch (err: any) {
      toast.error('Failed to load sales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [statusFilter]);

  const currency = settings?.currency || 'PKR';

  const handleOpenSaleDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
  };

  const handleOpenReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  };

  const handleOpenVoidModal = (sale: Sale) => {
    setSelectedSale(sale);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedSale) return;
    if (!voidReason.trim()) {
      toast.error('Please provide a reason for voiding this transaction');
      return;
    }

    setIsVoiding(true);
    try {
      await PosService.voidSale(
        selectedSale.id,
        profile?.id || 'admin',
        voidReason.trim()
      );
      toast.success(`Transaction ${selectedSale.invoice_number} voided successfully`);
      setIsVoidOpen(false);
      setIsDetailOpen(false);
      loadSales();
    } catch (err: any) {
      toast.error('Failed to void sale: ' + err.message);
    } finally {
      setIsVoiding(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchesInvoice = s.invoice_number.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      (s.cashier_name && s.cashier_name.toLowerCase().includes(searchInvoice.toLowerCase()));

    if (!matchesInvoice) return false;
    if (!matchesPaymentFilter(s.payment_method, paymentFilter)) return false;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Sales Ledger & Transactions
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Audit completed and voided sales, view full ticket breakdowns, and reprint receipts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Invoice (e.g. FB-000001) or Cashier Name..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
          />
        </div>

        <div className="flex min-w-0 items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-0 flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 sm:flex-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed Only</option>
            <option value="voided">Voided Only</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="min-w-0 flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 sm:flex-none"
          >
            <option value="all">All Payments</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Subtotal</th>
                <th className="px-5 py-3.5 text-right">Discount</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-stone-400">
                    No sales transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4 font-mono font-bold text-stone-900 text-sm">
                      {sale.invoice_number}
                      {sale.token_number ? (
                        <div className="text-[10px] font-semibold text-stone-400">Token {sale.token_number}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {new Date(sale.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-stone-800 font-semibold">
                      {sale.cashier_name || 'Cashier'}
                    </td>
                    <td className="px-5 py-4 uppercase text-[11px] font-bold text-stone-600">
                      {paymentMethodLabel(sale.payment_method)}
                    </td>
                    <td className="px-5 py-4 font-mono text-right text-stone-600">
                      {currency} {sale.subtotal.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-right text-emerald-700">
                      {sale.discount_amount > 0
                        ? `- ${currency} ${sale.discount_amount.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-right text-stone-950 text-sm">
                      {currency} {sale.total_amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSaleDetail(sale)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenReceipt(sale)}
                          className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 rounded-lg transition"
                          title="Reprint Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => handleOpenVoidModal(sale)}
                            className="p-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 rounded-lg transition"
                            title="Void Transaction"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Breakdown Modal */}
      {isDetailOpen && selectedSale && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92dvh]">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-200" />
                <h2 className="font-bold text-sm tracking-tight">
                  Transaction: {selectedSale.invoice_number}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Status Header Banner */}
              <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                <div>
                  <div className="text-stone-500 font-medium">Recorded:</div>
                  <div className="font-bold text-stone-900">
                    {new Date(selectedSale.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-stone-500 font-medium">Cashier:</div>
                  <div className="font-bold text-stone-900">
                    {selectedSale.cashier_name || 'Staff User'}
                  </div>
                </div>
              </div>

              {/* Void notice if voided */}
              {selectedSale.status === 'voided' && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-col gap-1 text-xs text-rose-900">
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Transaction Voided
                  </div>
                  <div>
                    <span className="font-semibold">Reason: </span>
                    <span>{selectedSale.void_reason || 'No reason specified'}</span>
                  </div>
                  {selectedSale.voided_at && (
                    <div className="text-[11px] text-rose-700">
                      Voided at: {new Date(selectedSale.voided_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Items List */}
              <div>
                <h3 className="font-bold text-xs text-stone-700 uppercase tracking-wider mb-2">
                  Order Line Items
                </h3>
                <div className="flex flex-col gap-1.5 divide-y divide-stone-100 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {selectedSale.sale_items?.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-stone-900">{item.product_name}</div>
                        <div className="text-[11px] text-stone-500">
                          {item.quantity} × {currency} {item.unit_price.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-stone-950">
                        {currency} {item.total.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {currency} {selectedSale.subtotal.toLocaleString()}
                  </span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({selectedSale.discount_name || 'Promo'}):</span>
                    <span className="font-mono font-bold">
                      - {currency} {selectedSale.discount_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedSale.tax_amount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>GST:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {currency} {selectedSale.tax_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedSale.service_charge_amount > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Service charge:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {currency} {selectedSale.service_charge_amount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-950 text-base">
                  <span>Total Amount:</span>
                  <span className="font-mono">
                    {currency} {selectedSale.total_amount.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between text-stone-600">
                  <span>Payment Method:</span>
                  <span className="font-bold uppercase text-stone-900">
                    {paymentMethodLabel(selectedSale.payment_method)}
                  </span>
                </div>
                {selectedSale.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between text-stone-600">
                      <span>Cash Tendered:</span>
                      <span className="font-mono">
                        {currency} {selectedSale.cash_received.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Change Given:</span>
                      <span className="font-mono">
                        {currency} {selectedSale.change_amount.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsReceiptOpen(true);
                }}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-orange-200" />
                <span>Reprint 80mm Receipt</span>
              </button>
              {selectedSale.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsVoidOpen(true);
                  }}
                  className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Ban className="w-4 h-4" />
                  <span>Void Sale</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {isVoidOpen && selectedSale && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="font-bold text-base tracking-tight">
                  Void Transaction {selectedSale.invoice_number}
                </h2>
              </div>
              <button
                onClick={() => setIsVoidOpen(false)}
                className="p-1 rounded-md text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <p className="text-xs text-stone-600 leading-normal">
                Voiding will mark this sale as canceled. Financial reports will adjust accordingly. Please enter a mandatory audit justification below.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reason for Voiding *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer cancelled order / Wrong item punched / Duplicate transaction"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsVoidOpen(false)}
                  disabled={isVoiding}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  disabled={isVoiding || !voidReason.trim()}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs"
                >
                  {isVoiding ? 'Voiding...' : 'Confirm Void Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={selectedSale}
        settings={settings || defaultStoreSettings()}
        onStartNewOrder={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}
