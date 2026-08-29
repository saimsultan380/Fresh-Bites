import { PaymentMethod } from '@/types/pos';

export const CHECKOUT_METHODS: { id: PaymentMethod; label: string; short: string }[] = [
  { id: 'cash', label: 'Cash', short: 'CASH' },
  { id: 'card', label: 'Card', short: 'CARD' },
  { id: 'other', label: 'Online', short: 'ONLINE' },
];

export const PAYMENT_METHODS = CHECKOUT_METHODS;

export function paymentMethodLabel(method?: string | null): string {
  if (method === 'cash') return 'Cash';
  if (method === 'card') return 'Card';
  if (
    method === 'other' ||
    method === 'jazzcash' ||
    method === 'easypaisa' ||
    method === 'bank'
  ) {
    return 'Online';
  }
  return method ? method.toUpperCase() : 'Cash';
}

export function isCashLike(method: PaymentMethod): boolean {
  return method === 'cash';
}

export function matchesPaymentFilter(method: string, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'other' || filter === 'online') {
    return ['other', 'jazzcash', 'easypaisa', 'bank'].includes(method);
  }
  return method === filter;
}
