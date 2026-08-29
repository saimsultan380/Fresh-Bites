'use client';

import React from 'react';
import { Product } from '@/types/pos';
import { getCategoryTheme } from '@/lib/constants/colors';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  currency: string;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export function ProductCard({
  product,
  currency,
  onAddToCart,
  cartQuantity = 0,
}: ProductCardProps) {
  const isInCart = cartQuantity > 0;
  const theme = getCategoryTheme(product.category?.slug);

  return (
    <button
      onClick={() => onAddToCart(product)}
      className={cn(
        'group flex min-h-[112px] cursor-pointer flex-col rounded-xl border p-3 text-left transition-colors select-none active:scale-[0.99] sm:min-h-[128px] sm:p-3.5',
        isInCart ? theme.cardSelected : theme.cardIdle
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {product.category ? (
          <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', theme.tagBg, theme.tagText)}>
            {product.category.name}
          </span>
        ) : (
          <span />
        )}

        {isInCart && (
          <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold', theme.qtyBadge)}>
            {cartQuantity}×
          </span>
        )}
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-sm leading-snug font-semibold text-stone-900">
        {product.name}
      </h3>
      {product.description && (
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{product.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="text-sm font-bold text-stone-900">
          <span className="mr-1 text-[11px] font-medium text-stone-400">{currency}</span>
          {product.price.toLocaleString()}
        </div>

        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg transition-colors',
            isInCart ? theme.addSelected : theme.addIdle
          )}
        >
          {isInCart ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>
      </div>
    </button>
  );
}
