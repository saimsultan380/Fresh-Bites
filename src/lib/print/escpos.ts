export type ReceiptAlign = 'left' | 'center' | 'right';

export type ReceiptLine =
  | { kind: 'text'; text: string; align?: ReceiptAlign; bold?: boolean; double?: boolean }
  | { kind: 'row'; left: string; right: string; bold?: boolean }
  | { kind: 'sep' }
  | { kind: 'blank' };

const ESC = 0x1b;
const GS = 0x1d;

export function paperCols(widthMm: number): number {
  // Conservative printable columns (Font A) so right edge never clips on cheap 58/80mm heads
  return widthMm === 58 ? 32 : 42;
}

export function dashLine(cols: number): string {
  return '-'.repeat(Math.max(8, cols));
}

export function padRow(left: string, right: string, cols: number): string {
  const gap = 1;
  const safeCols = Math.max(8, cols);
  let rightText = String(right ?? '');
  let leftText = String(left ?? '');

  // Keep amounts/values fully visible; trim the label side first.
  if (rightText.length > safeCols - 2) {
    rightText = rightText.slice(0, safeCols - 2);
  }

  const maxLeft = Math.max(1, safeCols - rightText.length - gap);
  if (leftText.length > maxLeft) {
    leftText = leftText.slice(0, maxLeft);
  }

  const spaces = Math.max(gap, safeCols - leftText.length - rightText.length);
  return leftText + ' '.repeat(spaces) + rightText;
}

/** Flatten receipt lines into exact printer-width text rows (for preview / WhatsApp). */
export function flattenReceiptLines(lines: ReceiptLine[], cols: number): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (line.kind === 'blank') {
      out.push('');
      continue;
    }
    if (line.kind === 'sep') {
      out.push(dashLine(cols));
      continue;
    }
    if (line.kind === 'row') {
      out.push(padRow(line.left, line.right, cols));
      continue;
    }
    const width = line.double ? Math.floor(cols / 2) : cols;
    wrapText(line.text, width).forEach((part) => {
      if (line.align === 'center') {
        const pad = Math.max(0, Math.floor((width - part.length) / 2));
        out.push(' '.repeat(pad) + part);
      } else if (line.align === 'right') {
        out.push(part.padStart(width, ' '));
      } else {
        out.push(part);
      }
    });
  }
  return out;
}

export function wrapText(text: string, cols: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word.slice(0, cols);
      continue;
    }
    if ((current + ' ' + word).length <= cols) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word.slice(0, cols);
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export class EscPosEncoder {
  private chunks: number[] = [];

  init(): this {
    this.chunks.push(ESC, 0x40);
    // USA code page — ASCII amounts and English receipts
    this.chunks.push(ESC, 0x74, 0x00);
    return this;
  }

  align(value: ReceiptAlign): this {
    const n = value === 'center' ? 1 : value === 'right' ? 2 : 0;
    this.chunks.push(ESC, 0x61, n);
    return this;
  }

  bold(on: boolean): this {
    this.chunks.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  double(on: boolean): this {
    this.chunks.push(GS, 0x21, on ? 0x11 : 0x00);
    return this;
  }

  text(value: string): this {
    const normalized = value.replace(/\r/g, '').replace(/[^\x20-\x7E\n]/g, '?');
    for (let i = 0; i < normalized.length; i++) {
      this.chunks.push(normalized.charCodeAt(i));
    }
    return this;
  }

  line(value = ''): this {
    return this.text(value).text('\n');
  }

  feed(lines: number): this {
    const n = Math.max(0, Math.min(20, Math.round(lines)));
    if (n > 0) this.chunks.push(ESC, 0x64, n);
    return this;
  }

  cut(mode: 'full' | 'partial' = 'partial'): this {
    if (mode === 'full') {
      // Full cut with no extra feed unit
      this.chunks.push(GS, 0x56, 0x00);
    } else {
      // Partial cut (no feed) — keeps slip length tight after footer
      this.chunks.push(GS, 0x56, 0x01);
    }
    return this;
  }

  cashDrawer(): this {
    this.chunks.push(ESC, 0x70, 0x00, 0x19, 0xfa);
    this.chunks.push(ESC, 0x70, 0x01, 0x19, 0xfa);
    return this;
  }

  encodeLines(lines: ReceiptLine[], cols: number): this {
    for (const line of lines) {
      if (line.kind === 'blank') {
        this.line();
        continue;
      }
      if (line.kind === 'sep') {
        this.align('left').bold(false).double(false).line(dashLine(cols));
        continue;
      }
      if (line.kind === 'row') {
        this.align('left').bold(!!line.bold).double(false).line(padRow(line.left, line.right, cols));
        continue;
      }
      this.align(line.align || 'left').bold(!!line.bold).double(!!line.double);
      const wrapped = wrapText(line.text, line.double ? Math.floor(cols / 2) : cols);
      wrapped.forEach((part) => this.line(part));
      this.double(false).bold(false);
    }
    return this;
  }

  bytes(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}
