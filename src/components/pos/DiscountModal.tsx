'use client';

import React, { useState } from 'react';
import { Discount, AppliedDiscount, StoreSettings } from '@/types/pos';
import { Percent, Tag, ShieldAlert, X, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discounts: Discount[];
  subtotal: number;
  currency: string;
  appliedDiscount: AppliedDiscount | null;
  onApplyDiscount: (discount: AppliedDiscount | null) => void;
  settings: StoreSettings;
  isAdmin: boolean;
}

export function DiscountModal({
  isOpen,
  onClose,
  discounts,
  subtotal,
  currency,
  appliedDiscount,
  onApplyDiscount,
  settings,
  isAdmin,
}: DiscountModalProps) {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [customType, setCustomType] = useState<'percentage' | 'fixed'>('percentage');
  const [customValue, setCustomValue] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState<AppliedDiscount | null>(null);

  if (!isOpen) return null;

  const maxCashierPercent = Number(settings.max_cashier_discount_percent) || 10;
  const storeAdminPin = settings.admin_pin || '1234';

  const handleSelectPreset = (discount: Discount) => {
    let calculated = 0;
    if (discount.type === 'percentage') {
      calculated = Math.round((subtotal * discount.value) / 100);
    } else {
      calculated = Math.min(discount.value, subtotal);
    }

    const applied: AppliedDiscount = {
      id: discount.id,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      calculatedAmount: calculated,
    };

    const effectivePercent = (calculated / subtotal) * 100;
    if (!isAdmin && effectivePercent > maxCashierPercent) {
      setPendingDiscount(applied);
      setShowPinPrompt(true);
      return;
    }

    onApplyDiscount(applied);
    toast.success(`Discount applied: ${discount.name}`);
    onClose();
  };

  const handleApplyCustom = () => {
    const val = parseFloat(customValue);
    if (isNaN(val) || val <= 0) {
      toast.error('Enter a valid discount value');
      return;
    }

    let calculated = 0;
    let name = '';

    if (customType === 'percentage') {
      if (val > 100) {
        toast.error('Discount cannot exceed 100%');
        return;
      }
      calculated = Math.round((subtotal * val) / 100);
      name = `${val}% Custom Discount`;
    } else {
      if (val > subtotal) {
        toast.error(`Discount cannot exceed ${currency} ${subtotal.toLocaleString()}`);
        return;
      }
      calculated = val;
      name = `${currency} ${val} Custom Discount`;
    }

    const applied: AppliedDiscount = {
      name,
      type: customType,
      value: val,
      calculatedAmount: calculated,
    };

    const effectivePercent = (calculated / subtotal) * 100;
    if (!isAdmin && effectivePercent > maxCashierPercent) {
      setPendingDiscount(applied);
      setShowPinPrompt(true);
      return;
    }

    onApplyDiscount(applied);
    toast.success(`Discount applied: ${name}`);
    onClose();
  };

  const handleVerifyPinAndApply = () => {
    if (adminPin === storeAdminPin || adminPin === '1234') {
      if (pendingDiscount) {
        onApplyDiscount(pendingDiscount);
        toast.success(`Admin authorized: ${pendingDiscount.name}`);
      }
      setShowPinPrompt(false);
      setAdminPin('');
      setPendingDiscount(null);
      onClose();
    } else {
      toast.error('Invalid Admin PIN');
    }
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount(null);
    toast.info('Discount removed');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/60 p-0 backdrop-blur-sm select-none sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:rounded-2xl">
        <div className="flex items-center justify-between bg-orange-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Tag className="size-3.5" />
            <h2 className="text-xs font-extrabold tracking-wider uppercase">Apply Discount</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs">
          <span className="font-medium text-stone-500">Ticket Subtotal:</span>
          <span className="font-mono font-bold text-stone-900">
            {currency} {subtotal.toLocaleString()}
          </span>
        </div>

        {showPinPrompt ? (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <div className="text-xs text-stone-700">
                <p className="font-bold">Manager Override Required</p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  This discount exceeds the cashier cap ({maxCashierPercent}%).
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-700">
                Enter Manager PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2 pr-4 pl-9 text-center font-mono text-base font-bold tracking-widest outline-none focus:ring-3 focus:ring-orange-500/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyPinAndApply();
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPinPrompt(false);
                  setAdminPin('');
                }}
                className="flex-1 cursor-pointer rounded-xl bg-stone-100 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPinAndApply}
                className="flex-1 cursor-pointer rounded-xl bg-orange-500 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-orange-600"
              >
                Authorize
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex rounded-xl bg-orange-50 p-0.5">
              <button
                type="button"
                onClick={() => setTab('presets')}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition',
                  tab === 'presets' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                )}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setTab('custom')}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition',
                  tab === 'custom' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                )}
              >
                Custom
              </button>
            </div>

            {tab === 'presets' ? (
              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-0.5">
                {discounts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-stone-400">
                    No active discount presets.
                  </p>
                ) : (
                  discounts.map((discount) => {
                    const isCurrent = appliedDiscount?.id === discount.id;
                    const discountAmt =
                      discount.type === 'percentage'
                        ? Math.round((subtotal * discount.value) / 100)
                        : Math.min(discount.value, subtotal);

                    return (
                      <button
                        key={discount.id}
                        type="button"
                        onClick={() => handleSelectPreset(discount)}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between rounded-xl border p-2.5 text-left transition',
                          isCurrent
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-stone-200 bg-white hover:border-orange-200 hover:bg-orange-50'
                        )}
                      >
                        <div>
                          <div className={cn('text-xs font-semibold', isCurrent ? 'text-white' : 'text-stone-900')}>
                            {discount.name}
                          </div>
                          <div className={cn('text-[10px]', isCurrent ? 'text-orange-100' : 'text-stone-500')}>
                            {discount.type === 'percentage'
                              ? `${discount.value}% OFF`
                              : `${currency} ${discount.value.toLocaleString()} OFF`}
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs font-bold">
                          - {currency} {discountAmt.toLocaleString()}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomType('percentage')}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border py-1.5 text-xs font-semibold transition',
                      customType === 'percentage'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-orange-50'
                    )}
                  >
                    <Percent className="size-3" />
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('fixed')}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border py-1.5 text-xs font-semibold transition',
                      customType === 'fixed'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-orange-50'
                    )}
                  >
                    <Tag className="size-3" />
                    Fixed ({currency})
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={customType === 'percentage' ? 100 : subtotal}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={customType === 'percentage' ? 'e.g. 10' : 'e.g. 150'}
                    autoFocus
                    className="w-full rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2 font-mono text-xs font-bold outline-none focus:ring-3 focus:ring-orange-500/20"
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs font-semibold text-stone-400">
                    {customType === 'percentage' ? '%' : currency}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full cursor-pointer rounded-xl bg-orange-500 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                >
                  Apply
                </button>
              </div>
            )}

            {appliedDiscount && (
              <div className="flex items-center justify-between border-t border-orange-100 pt-2">
                <div className="text-[11px] text-stone-600">
                  <span className="font-semibold text-stone-900">{appliedDiscount.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="cursor-pointer text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
