'use client';

import React from 'react';
import { CartItem, AppliedDiscount, OrderType } from '@/types/pos';
import {
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShoppingBag,
  Pause,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderTypePicker } from '@/components/pos/OrderTypePicker';

interface CartSidebarProps {
  cart: CartItem[];
  currency: string;
  subtotal: number;
  discount: AppliedDiscount | null;
  taxAmount: number;
  taxPercent: number;
  serviceChargeAmount: number;
  serviceChargePercent: number;
  grandTotal: number;
  heldCount: number;
  onHoldOrder: () => void;
  onOpenHeld: () => void;
  onUpdateQuantity: (uid: string, delta: number) => void;
  onRemoveItem: (uid: string) => void;
  onClearCart: () => void;
  onOpenDiscountModal: () => void;
  onOpenPaymentModal: () => void;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  className?: string;
}

export function CartSidebar({
  cart,
  currency,
  subtotal,
  discount,
  taxAmount,
  taxPercent,
  serviceChargeAmount,
  serviceChargePercent,
  grandTotal,
  heldCount,
  onHoldOrder,
  onOpenHeld,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenDiscountModal,
  onOpenPaymentModal,
  orderType,
  onOrderTypeChange,
  className,
}: CartSidebarProps) {
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-full shrink-0 flex-col border-l border-stone-200 bg-white select-none lg:w-[370px] xl:w-[390px]',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900">Current Order</h2>
          <p className="text-[11px] text-stone-500">
            {totalItemCount === 0
              ? 'No items yet'
              : `${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenHeld}
            className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-stone-600 hover:bg-stone-50"
          >
            <ListChecks className="size-3.5" />
            {heldCount > 0 ? heldCount : 'Held'}
          </button>
          {cart.length > 0 && (
            <>
              <button
                onClick={onHoldOrder}
                className="cursor-pointer rounded-lg px-2 py-1 text-[11px] font-bold text-orange-700 transition hover:bg-orange-50"
                title="Hold this order"
              >
                <Pause className="mr-1 inline size-3.5" />
                Hold
              </button>
              <button
                onClick={onClearCart}
                className="cursor-pointer rounded-lg p-1.5 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                title="Clear Order"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-sm font-semibold text-stone-800">Order is empty</p>
            <p className="mt-1 max-w-[200px] text-xs text-stone-500">
              Tap menu items to add them to this ticket.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.uid} className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.item_type === 'deal' && (
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 uppercase">
                        Deal
                      </span>
                    )}
                    <h4 className="truncate text-xs font-semibold text-stone-900">{item.name}</h4>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-400">
                    {currency} {item.unit_price.toLocaleString()} each
                  </div>
                </div>

                <div className="text-xs font-bold text-stone-900">
                  {currency} {item.total.toLocaleString()}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.uid, -1)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-md text-stone-700 transition hover:bg-white sm:size-7"
                    title="Decrease"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.uid, 1)}
                    className="flex size-9 cursor-pointer items-center justify-center rounded-md bg-orange-500 text-white transition hover:bg-orange-600 sm:size-7"
                    title="Increase"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <button
                  onClick={() => onRemoveItem(item.uid)}
                  className="cursor-pointer p-1 text-stone-400 transition hover:text-rose-600"
                  title="Remove item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2.5 border-t border-stone-200 bg-stone-50 p-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold tracking-wider text-stone-400 uppercase">Order type</p>
          <OrderTypePicker orderType={orderType} onChange={onOrderTypeChange} />
        </div>

        <div className="flex justify-between text-xs text-stone-600">
          <span>Subtotal</span>
          <span className="font-semibold text-stone-900">
            {currency} {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onOpenDiscountModal}
            disabled={cart.length === 0}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-orange-700 transition hover:text-orange-800 disabled:opacity-40"
          >
            <Tag className="size-3.5" />
            <span>{discount ? `Discount (${discount.name})` : 'Add discount'}</span>
          </button>

          {discount ? (
            <span className="text-xs font-semibold text-emerald-600">
              - {currency} {discount.calculatedAmount.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-stone-400">—</span>
          )}
        </div>

          {taxAmount > 0 && (
            <div className="flex justify-between text-xs text-stone-600">
              <span>GST {taxPercent}%</span>
              <span className="font-semibold text-stone-900">
                {currency} {taxAmount.toLocaleString()}
              </span>
            </div>
          )}

          {serviceChargeAmount > 0 && (
            <div className="flex justify-between text-xs text-stone-600">
              <span>Service {serviceChargePercent}%</span>
              <span className="font-semibold text-stone-900">
                {currency} {serviceChargeAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-between border-t border-stone-200 pt-2.5">
          <span className="text-xs font-semibold text-stone-500 uppercase">Total</span>
          <span className="text-2xl font-bold text-stone-950">
            <span className="mr-1 text-xs font-medium text-stone-400">{currency}</span>
            {grandTotal.toLocaleString()}
          </span>
        </div>

        <button
          onClick={onOpenPaymentModal}
          disabled={cart.length === 0}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <span>Pay {currency} {grandTotal.toLocaleString()}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </aside>
  );
}
