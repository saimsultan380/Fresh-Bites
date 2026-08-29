'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod, OrderType } from '@/types/pos';
import {
  Banknote,
  CreditCard,
  Smartphone,
  X,
  Delete,
  CornerDownLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CHECKOUT_METHODS } from '@/lib/constants/payments';
import { OrderTypePicker } from '@/components/pos/OrderTypePicker';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discountAmount: number;
  discountName?: string;
  taxAmount?: number;
  taxPercent?: number;
  serviceChargeAmount?: number;
  serviceChargePercent?: number;
  totalAmount: number;
  currency: string;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  tableNo: string;
  onTableNoChange: (value: string) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (value: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (value: string) => void;
  onCompleteSale: (payment: {
    paymentMethod: PaymentMethod;
    cashReceived: number;
    changeAmount: number;
  }) => Promise<void>;
  isProcessing: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  subtotal,
  discountAmount,
  discountName,
  taxAmount = 0,
  taxPercent = 0,
  serviceChargeAmount = 0,
  serviceChargePercent = 0,
  totalAmount,
  currency,
  orderType,
  onOrderTypeChange,
  tableNo,
  onTableNoChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  deliveryAddress,
  onDeliveryAddressChange,
  onCompleteSale,
  isProcessing,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setCashReceivedStr('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, totalAmount]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, method, cashReceivedStr, totalAmount, orderType, customerPhone]);

  const cashReceived = parseFloat(cashReceivedStr) || 0;
  const changeAmount = method === 'cash' ? Math.max(0, cashReceived - totalAmount) : 0;
  const isCashShort = method === 'cash' && cashReceived < totalAmount && cashReceivedStr !== '';

  const complete = async (payment: {
    paymentMethod: PaymentMethod;
    cashReceived: number;
    changeAmount: number;
  }) => {
    if (orderType === 'delivery' && !customerPhone.trim()) {
      toast.error('Enter customer mobile number for delivery');
      return;
    }
    await onCompleteSale(payment);
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setCashReceivedStr('');
      inputRef.current?.focus();
    } else if (val === 'BACK') {
      setCashReceivedStr((prev) => prev.slice(0, -1));
      inputRef.current?.focus();
    } else if (val === 'EXACT') {
      setCashReceivedStr(totalAmount.toString());
      inputRef.current?.focus();
    } else {
      setCashReceivedStr((prev) => prev + val);
      inputRef.current?.focus();
    }
  };

  const handleAddPreset = (amount: number) => {
    setCashReceivedStr(amount.toString());
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (method === 'cash') {
      const currentVal = parseFloat(cashReceivedStr);
      if (!cashReceivedStr || isNaN(currentVal)) {
        await complete({
          paymentMethod: 'cash',
          cashReceived: totalAmount,
          changeAmount: 0,
        });
        return;
      }
      if (currentVal < totalAmount) {
        toast.error(`Cash received (${currency} ${currentVal.toLocaleString()}) is less than total`);
        return;
      }
      await complete({
        paymentMethod: 'cash',
        cashReceived: currentVal,
        changeAmount: Math.max(0, currentVal - totalAmount),
      });
    } else {
      await complete({
        paymentMethod: method,
        cashReceived: totalAmount,
        changeAmount: 0,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 p-0 backdrop-blur-sm select-none sm:items-center sm:p-3">
      <div className="flex max-h-[100dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:max-h-[90dvh] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between bg-orange-600 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <Banknote className="size-4" />
            <h2 className="text-xs font-extrabold tracking-wider uppercase">Payment & Checkout</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 font-mono text-[11px] text-orange-100 sm:flex">
              <span>Press</span>
              <kbd className="rounded-md border border-white/20 bg-black/15 px-1.5 py-0.5 text-[10px]">Enter ↵</kbd>
              <span>to pay</span>
            </span>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="cursor-pointer rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-12">
          <div className="flex flex-col justify-between gap-4 border-b border-orange-100 bg-orange-50/40 p-4 sm:p-5 md:col-span-5 md:border-r md:border-b-0">
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  Order type
                </label>
                <OrderTypePicker orderType={orderType} onChange={onOrderTypeChange} />
                {orderType === 'dine_in' && (
                  <input
                    value={tableNo}
                    onChange={(e) => onTableNoChange(e.target.value)}
                    placeholder="Table no. (optional)"
                    className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-400"
                  />
                )}
                {orderType === 'delivery' && (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                      placeholder="Customer name"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-400"
                    />
                    <input
                      value={customerPhone}
                      onChange={(e) => onCustomerPhoneChange(e.target.value)}
                      placeholder="03xx-xxxxxxx"
                      inputMode="tel"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-400"
                    />
                    <input
                      value={deliveryAddress}
                      onChange={(e) => onDeliveryAddressChange(e.target.value)}
                      placeholder="Delivery address"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  Select Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CHECKOUT_METHODS.map((item) => {
                    const active = method === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMethod(item.id);
                          if (item.id === 'cash') inputRef.current?.focus();
                        }}
                        className={cn(
                          'flex min-h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-[10px] font-bold transition',
                          active
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        )}
                      >
                        {item.id === 'cash' && <Banknote className="size-3.5" />}
                        {item.id === 'card' && <CreditCard className="size-3.5" />}
                        {item.id === 'other' && <Smartphone className="size-3.5" />}
                        <span>{item.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-orange-100 bg-white p-3.5 text-xs shadow-xs">
                <div className="flex justify-between font-medium text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-stone-900">
                    {currency} {subtotal.toLocaleString()}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-700">
                    <span>{discountName || 'Discount'}</span>
                    <span className="font-mono font-bold">
                      - {currency} {discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between font-medium text-stone-500">
                    <span>GST {taxPercent}%</span>
                    <span className="font-mono font-bold text-stone-900">
                      {currency} {taxAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between font-medium text-stone-500">
                    <span>Service {serviceChargePercent}%</span>
                    <span className="font-mono font-bold text-stone-900">
                      {currency} {serviceChargeAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-t border-orange-100 pt-2">
                  <span className="text-xs font-bold tracking-wider text-stone-700 uppercase">Total Due</span>
                  <span className="font-mono text-xl font-black text-stone-950">
                    <span className="mr-0.5 font-sans text-xs text-stone-400">{currency}</span>
                    {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {method === 'cash' && (
              <div className={cn(
                'rounded-2xl border p-3.5',
                isCashShort ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'
              )}>
                <div className="text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                  {isCashShort ? 'Amount Short' : 'Change Due Back'}
                </div>
                <div className={cn('mt-0.5 font-mono text-xl font-black', isCashShort ? 'text-rose-600' : 'text-emerald-700')}>
                  <span className="mr-1 font-sans text-xs text-stone-400">{currency}</span>
                  {isCashShort
                    ? (totalAmount - cashReceived).toLocaleString()
                    : changeAmount.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3.5 p-4 sm:p-5 md:col-span-7">
            {method === 'cash' ? (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-stone-600">
                    <span>Cash Tendered</span>
                    <span className="text-[10px] font-normal text-stone-400">
                      Enter for exact ({totalAmount.toLocaleString()})
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-2xl border border-stone-800 bg-[#1a120e] px-4 py-3 shadow-inner">
                    <span className="mr-2 shrink-0 text-xs font-bold text-orange-300/70 uppercase">
                      {currency}
                    </span>
                    <input
                      ref={inputRef}
                      type="number"
                      min={0}
                      step="any"
                      value={cashReceivedStr}
                      onChange={(e) => setCashReceivedStr(e.target.value)}
                      placeholder={totalAmount.toLocaleString()}
                      className="w-full bg-transparent text-right font-mono text-2xl font-black tracking-wider text-amber-300 outline-none placeholder:text-stone-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('EXACT')}
                    className="cursor-pointer rounded-xl bg-orange-100 py-2 text-xs font-bold text-orange-800 transition hover:bg-orange-200"
                  >
                    Exact
                  </button>
                  {[500, 1000, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="cursor-pointer rounded-xl bg-stone-100 py-2 font-mono text-xs font-bold text-stone-800 transition hover:bg-stone-200"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="cursor-pointer rounded-xl border border-stone-200 bg-white py-2.5 font-mono text-base font-bold text-stone-800 shadow-xs transition hover:bg-orange-50 active:bg-orange-100 sm:py-3"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('CLEAR')}
                    className="cursor-pointer rounded-xl bg-rose-50 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    CLR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="cursor-pointer rounded-xl border border-stone-200 bg-white py-3 font-mono text-base font-bold text-stone-800 shadow-xs transition hover:bg-orange-50"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('BACK')}
                    className="flex cursor-pointer items-center justify-center rounded-xl bg-stone-100 py-3 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
                  >
                    <Delete className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-auto flex flex-col gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-8 text-center">
                <p className="text-xs font-bold tracking-wider text-sky-800 uppercase">
                  {method === 'card' ? 'Card swipe / tap' : 'Online payment received'}
                </p>
                <div className="font-mono text-2xl font-black text-stone-950">
                  {currency} {totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-stone-500">
                  Confirm the customer has paid this amount, then complete.
                </p>
              </div>
            )}

            <div className="border-t border-orange-100 pt-2">
              <button
                type="button"
                disabled={isProcessing || (method === 'cash' && cashReceivedStr !== '' && cashReceived < totalAmount)}
                onClick={handleSubmit}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Complete & Print Receipt</span>
                    <CornerDownLeft className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
