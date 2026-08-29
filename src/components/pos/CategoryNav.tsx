'use client';

import React from 'react';
import { Category } from '@/types/pos';
import { getCategoryTheme } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';

interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  dealsCount: number;
}

export function CategoryNav({
  categories,
  selectedCategoryId,
  onSelectCategory,
  dealsCount,
}: CategoryNavProps) {
  return (
    <nav className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain border-b border-stone-200 bg-white px-3 py-2.5 select-none sm:px-3.5">
      <button
        onClick={() => onSelectCategory('all')}
        className={cn(
          'min-h-10 cursor-pointer whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-semibold transition sm:min-h-8 sm:px-3 sm:py-1.5 sm:text-xs',
          selectedCategoryId === 'all'
            ? 'border-orange-500 bg-orange-500 text-white'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
        )}
      >
        All Items
      </button>

      <button
        onClick={() => onSelectCategory('deals')}
        className={cn(
          'flex min-h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-semibold transition sm:min-h-8 sm:px-3 sm:py-1.5 sm:text-xs',
          selectedCategoryId === 'deals'
            ? 'border-violet-600 bg-violet-600 text-white'
            : 'border-stone-200 bg-white text-stone-700 hover:bg-violet-50 hover:text-violet-800'
        )}
      >
        Combo Deals
        {dealsCount > 0 && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
              selectedCategoryId === 'deals' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
            )}
          >
            {dealsCount}
          </span>
        )}
      </button>

      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        const theme = getCategoryTheme(category.slug);

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'min-h-10 cursor-pointer whitespace-nowrap rounded-lg border px-3.5 py-2 text-sm font-semibold transition sm:min-h-8 sm:px-3 sm:py-1.5 sm:text-xs',
              isSelected ? theme.chipActive : theme.chipIdle
            )}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}
