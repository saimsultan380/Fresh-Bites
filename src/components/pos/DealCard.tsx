'use client';

import React from 'react';
import { Deal } from '@/types/pos';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  currency: string;
  onAddDealToCart: (deal: Deal) => void;
  cartQuantity?: number;
}

export function DealCard({
  deal,
  currency,
  onAddDealToCart,
  cartQuantity = 0,
}: DealCardProps) {
  const isInCart = cartQuantity > 0;
  const included = deal.deal_items
    ?.map((item) => `${item.quantity}× ${item.product?.name || 'Item'}`)
    .join(' · ');

  return (
    <button
      onClick={() => onAddDealToCart(deal)}
      className={cn(
        'group flex min-h-[112px] cursor-pointer flex-col rounded-xl border p-3 text-left transition-colors select-none active:scale-[0.99] sm:min-h-[128px] sm:p-3.5',
        isInCart
          ? 'border-violet-500 bg-violet-50'
          : 'border-stone-200 bg-white hover:border-violet-300'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
          Combo
        </span>

        {isInCart && (
          <span className="rounded-md bg-violet-600 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
            {cartQuantity}×
          </span>
        )}
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-sm leading-snug font-semibold text-stone-900">
        {deal.name}
      </h3>
      {included ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{included}</p>
      ) : deal.description ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{deal.description}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="text-sm font-bold text-stone-900">
          <span className="mr-1 text-[11px] font-medium text-stone-400">{currency}</span>
          {deal.price.toLocaleString()}
        </div>

        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg transition-colors',
            isInCart
              ? 'bg-violet-600 text-white'
              : 'bg-stone-100 text-stone-600 group-hover:bg-violet-600 group-hover:text-white'
          )}
        >
          {isInCart ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </div>
    </button>
  );
}
