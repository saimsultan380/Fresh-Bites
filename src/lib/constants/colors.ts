export interface CategoryTheme {
  name: string;
  accent: string;
  tagBg: string;
  tagText: string;
  iconName: string;
  chipIdle: string;
  chipActive: string;
  cardIdle: string;
  cardSelected: string;
  addIdle: string;
  addSelected: string;
  qtyBadge: string;
}

const DEFAULT_THEME: CategoryTheme = {
  name: 'Item',
  accent: '#f97316',
  tagBg: 'bg-orange-100',
  tagText: 'text-orange-700',
  iconName: 'default',
  chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
  chipActive: 'bg-orange-500 text-white border-orange-500',
  cardIdle: 'border-stone-200 bg-white hover:border-orange-300',
  cardSelected: 'border-orange-500 bg-orange-50',
  addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-orange-500 group-hover:text-white',
  addSelected: 'bg-orange-500 text-white',
  qtyBadge: 'bg-orange-500 text-white',
};

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  burgers: {
    name: 'Burgers',
    accent: '#e11d48',
    tagBg: 'bg-rose-100',
    tagText: 'text-rose-700',
    iconName: 'burger',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200',
    chipActive: 'bg-rose-500 text-white border-rose-500',
    cardIdle: 'border-stone-200 bg-white hover:border-rose-300',
    cardSelected: 'border-rose-500 bg-rose-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-rose-500 group-hover:text-white',
    addSelected: 'bg-rose-500 text-white',
    qtyBadge: 'bg-rose-500 text-white',
  },
  'fried-chicken': {
    name: 'Fried Chicken',
    accent: '#d97706',
    tagBg: 'bg-amber-100',
    tagText: 'text-amber-800',
    iconName: 'chicken',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200',
    chipActive: 'bg-amber-500 text-amber-950 border-amber-500',
    cardIdle: 'border-stone-200 bg-white hover:border-amber-300',
    cardSelected: 'border-amber-500 bg-amber-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-amber-500 group-hover:text-amber-950',
    addSelected: 'bg-amber-500 text-amber-950',
    qtyBadge: 'bg-amber-500 text-amber-950',
  },
  'wings-nuggets': {
    name: 'Wings & Nuggets',
    accent: '#ea580c',
    tagBg: 'bg-orange-100',
    tagText: 'text-orange-800',
    iconName: 'wings',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-200',
    chipActive: 'bg-orange-500 text-white border-orange-500',
    cardIdle: 'border-stone-200 bg-white hover:border-orange-300',
    cardSelected: 'border-orange-500 bg-orange-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-orange-500 group-hover:text-white',
    addSelected: 'bg-orange-500 text-white',
    qtyBadge: 'bg-orange-500 text-white',
  },
  'fries-sides': {
    name: 'Fries & Sides',
    accent: '#ca8a04',
    tagBg: 'bg-yellow-100',
    tagText: 'text-yellow-800',
    iconName: 'fries',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-200',
    chipActive: 'bg-yellow-400 text-yellow-950 border-yellow-400',
    cardIdle: 'border-stone-200 bg-white hover:border-yellow-400',
    cardSelected: 'border-yellow-500 bg-yellow-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-yellow-400 group-hover:text-yellow-950',
    addSelected: 'bg-yellow-400 text-yellow-950',
    qtyBadge: 'bg-yellow-400 text-yellow-950',
  },
  'drinks-juices': {
    name: 'Drinks & Juices',
    accent: '#0891b2',
    tagBg: 'bg-cyan-100',
    tagText: 'text-cyan-800',
    iconName: 'drinks',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-200',
    chipActive: 'bg-cyan-500 text-white border-cyan-500',
    cardIdle: 'border-stone-200 bg-white hover:border-cyan-300',
    cardSelected: 'border-cyan-500 bg-cyan-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-cyan-500 group-hover:text-white',
    addSelected: 'bg-cyan-500 text-white',
    qtyBadge: 'bg-cyan-500 text-white',
  },
  deals: {
    name: 'Combo Deals',
    accent: '#7c3aed',
    tagBg: 'bg-violet-100',
    tagText: 'text-violet-800',
    iconName: 'deal',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-violet-50 hover:text-violet-800 hover:border-violet-200',
    chipActive: 'bg-violet-600 text-white border-violet-600',
    cardIdle: 'border-stone-200 bg-white hover:border-violet-300',
    cardSelected: 'border-violet-500 bg-violet-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-violet-600 group-hover:text-white',
    addSelected: 'bg-violet-600 text-white',
    qtyBadge: 'bg-violet-600 text-white',
  },
};

export function getCategoryTheme(slug?: string | null): CategoryTheme {
  if (!slug) return DEFAULT_THEME;

  const normalized = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return theme;
    }
  }

  return {
    ...DEFAULT_THEME,
    name: 'Menu Item',
    accent: '#2563eb',
    tagBg: 'bg-sky-100',
    tagText: 'text-sky-800',
    chipIdle: 'bg-white text-stone-700 border-stone-200 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200',
    chipActive: 'bg-sky-500 text-white border-sky-500',
    cardIdle: 'border-stone-200 bg-white hover:border-sky-300',
    cardSelected: 'border-sky-500 bg-sky-50',
    addIdle: 'bg-stone-100 text-stone-600 group-hover:bg-sky-500 group-hover:text-white',
    addSelected: 'bg-sky-500 text-white',
    qtyBadge: 'bg-sky-500 text-white',
  };
}
