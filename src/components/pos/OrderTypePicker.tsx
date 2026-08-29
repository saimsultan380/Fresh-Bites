'use client';

import React from 'react';
import { OrderType } from '@/types/pos';
import { ORDER_TYPES } from '@/lib/constants/orders';
import { cn } from '@/lib/utils';

export function OrderTypePicker({
  orderType,
  onChange,
}: {
  orderType: OrderType;
  onChange: (type: OrderType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {ORDER_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onChange(type.id)}
          className={cn(
            'min-h-8 rounded-lg border px-1.5 text-[11px] font-bold transition',
            orderType === type.id
              ? 'border-orange-500 bg-orange-500 text-white'
              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
