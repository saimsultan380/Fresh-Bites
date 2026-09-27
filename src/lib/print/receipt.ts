import { Sale, StoreSettings } from '@/types/pos';
import { ReceiptLine, flattenReceiptLines, paperCols } from '@/lib/print/escpos';
import { paymentMethodLabel } from '@/lib/constants/payments';
import { orderTypeLabel } from '@/lib/constants/orders';

function money(n: number): string {
  return String(Math.round(Number(n) || 0));
}

function formatPkDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Karachi',
  });
  return { date, time };
}

function shortName(name: string, max = 18): string {
  const value = (name || '').trim();
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + '.';
}

export function buildReceiptLines(
  sale: Sale,
  settings: StoreSettings,
  copy: 'customer' | 'kitchen' = 'customer'
): ReceiptLine[] {
  const cols = paperCols(settings.paper_width_mm || 80);
  const { date, time } = formatPkDate(sale.created_at);
  const lines: ReceiptLine[] = [];

  lines.push({ kind: 'title', text: (settings.business_name || 'FRESH BITES').toUpperCase() });
  if (settings.tagline) {
    lines.push({ kind: 'text', text: settings.tagline, align: 'center' });
  }
  if (settings.address) {
    lines.push({ kind: 'text', text: settings.address, align: 'center' });
  }
  if (settings.phone) {
    lines.push({ kind: 'text', text: `Tel: ${settings.phone}`, align: 'center' });
  }
  if (settings.ntn) {
    lines.push({ kind: 'text', text: `NTN: ${settings.ntn}`, align: 'center' });
  }
  if (settings.strn) {
    lines.push({ kind: 'text', text: `STRN: ${settings.strn}`, align: 'center' });
  }

  lines.push({ kind: 'sep' });

  if (sale.token_number) {
    lines.push({ kind: 'text', text: `TOKEN ${sale.token_number}`, align: 'center', bold: true, double: true });
    lines.push({ kind: 'text', text: orderTypeLabel(sale.order_type || 'takeaway'), align: 'center', bold: true });
    lines.push({ kind: 'sep' });
  }

  if (copy === 'kitchen') {
    lines.push({ kind: 'text', text: '*** KITCHEN COPY ***', align: 'center', bold: true });
  }

  lines.push({ kind: 'row', left: 'Invoice', right: sale.invoice_number });
  lines.push({ kind: 'row', left: 'Date', right: `${date} ${time}` });
  lines.push({ kind: 'row', left: 'Cashier', right: shortName(sale.cashier_name || 'Counter', cols - 10) });
  if (sale.table_no) lines.push({ kind: 'row', left: 'Table', right: sale.table_no });
  if (sale.customer_name) {
    lines.push({ kind: 'row', left: 'Customer', right: shortName(sale.customer_name, cols - 12) });
  }
  if (sale.customer_phone) lines.push({ kind: 'row', left: 'Phone', right: sale.customer_phone });
  if (sale.delivery_address) {
    lines.push({ kind: 'text', text: `Addr: ${sale.delivery_address}`, align: 'left' });
  }

  lines.push({ kind: 'sep' });
  lines.push({ kind: 'row', left: 'ITEM', right: 'AMT', bold: true });

  (sale.sale_items || []).forEach((item) => {
    const name = item.item_type === 'deal' ? `[DEAL] ${item.product_name}` : item.product_name;
    const qty = Number(item.quantity) || 1;
    lines.push({
      kind: 'row',
      left: `${qty}x ${name}`,
      right: money(item.total),
      bold: true,
    });
  });

  lines.push({ kind: 'sep' });
  lines.push({ kind: 'row', left: 'Subtotal', right: money(sale.subtotal) });
  if (sale.discount_amount > 0) {
    const label = sale.discount_name ? `Discount (${sale.discount_name})` : 'Discount';
    lines.push({ kind: 'row', left: label, right: `- ${money(sale.discount_amount)}` });
  }
  if (sale.tax_amount > 0) {
    lines.push({ kind: 'row', left: `GST ${settings.tax_percent || 0}%`, right: money(sale.tax_amount) });
  }
  if (sale.service_charge_amount > 0) {
    lines.push({
      kind: 'row',
      left: `Service ${settings.service_charge_percent || 0}%`,
      right: money(sale.service_charge_amount),
    });
  }
  lines.push({
    kind: 'row',
    left: `TOTAL ${settings.currency || 'PKR'}`,
    right: money(sale.total_amount),
    bold: true,
  });

  if (copy === 'customer') {
    lines.push({ kind: 'sep' });
    lines.push({ kind: 'row', left: 'Payment', right: paymentMethodLabel(sale.payment_method) });
    if (sale.payment_method === 'cash') {
      lines.push({ kind: 'row', left: 'Cash', right: money(sale.cash_received) });
      lines.push({ kind: 'row', left: 'Change', right: money(sale.change_amount) });
    }
    lines.push({ kind: 'sep' });
    lines.push({
      kind: 'text',
      text: settings.receipt_footer || 'Thank You For Your Order!',
      align: 'center',
      bold: true,
    });
    lines.push({
      kind: 'text',
      text: '7 Gen Marketing Software',
      align: 'center',
      bold: true,
    });
    lines.push({
      kind: 'text',
      text: '0303-6690760, 0300-6031380',
      align: 'center',
    });
  } else {
    lines.push({ kind: 'sep' });
    lines.push({ kind: 'text', text: 'Prepare and pack this order', align: 'center', bold: true });
  }

  return lines;
}

export function receiptPlainText(sale: Sale, settings: StoreSettings, copy: 'customer' | 'kitchen' = 'customer'): string {
  const cols = paperCols(settings.paper_width_mm || 80);
  return flattenReceiptLines(buildReceiptLines(sale, settings, copy), cols).join('\n');
}

export function receiptWhatsAppText(sale: Sale, settings: StoreSettings): string {
  return receiptPlainText(sale, settings, 'customer');
}
