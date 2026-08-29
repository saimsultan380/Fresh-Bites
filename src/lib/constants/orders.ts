import { OrderType } from '@/types/pos';

export const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'dine_in', label: 'Dine-in' },
  { id: 'delivery', label: 'Delivery' },
];

export function orderTypeLabel(type?: string | null): string {
  return ORDER_TYPES.find((t) => t.id === type)?.label || 'Takeaway';
}
