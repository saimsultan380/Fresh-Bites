import { Sale, StoreSettings } from '@/types/pos';
import { EscPosEncoder, paperCols } from '@/lib/print/escpos';
import { buildReceiptLines } from '@/lib/print/receipt';

const PORT_KEY = 'fb-thermal-port';

type SerialPortLike = {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  getInfo?: () => { usbVendorId?: number; usbProductId?: number };
};

declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<SerialPortLike>;
      getPorts: () => Promise<SerialPortLike[]>;
    };
  }
}

let activePort: SerialPortLike | null = null;
let connecting: Promise<SerialPortLike> | null = null;

function serialApi() {
  if (typeof navigator === 'undefined' || !navigator.serial) {
    throw new Error('This browser cannot talk to a USB thermal printer. Use Chrome or Edge on the counter PC.');
  }
  return navigator.serial;
}

export function hasWebSerial(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

export function isPrinterConnected(): boolean {
  return !!activePort;
}

async function writeBytes(port: SerialPortLike, data: Uint8Array) {
  if (!port.writable) throw new Error('Printer port is not writable');
  const writer = port.writable.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

export async function connectThermalPrinter(baudRate = 9600): Promise<void> {
  const serial = serialApi();
  if (connecting) {
    await connecting;
    return;
  }
  connecting = (async () => {
    if (activePort) {
      try {
        await activePort.close();
      } catch {
        // already closed
      }
      activePort = null;
    }
    const port = await serial.requestPort();
    await port.open({ baudRate });
    activePort = port;
    return port;
  })();
  try {
    await connecting;
  } finally {
    connecting = null;
  }
}

export async function reconnectThermalPrinter(baudRate = 9600): Promise<boolean> {
  if (activePort) return true;
  if (!hasWebSerial()) return false;
  try {
    const ports = await serialApi().getPorts();
    const port = ports[0];
    if (!port) return false;
    await port.open({ baudRate });
    activePort = port;
    void PORT_KEY;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectThermalPrinter(): Promise<void> {
  if (!activePort) return;
  try {
    await activePort.close();
  } catch {
    // ignore
  }
  activePort = null;
}

function encodeJob(
  sale: Sale,
  settings: StoreSettings,
  copy: 'customer' | 'kitchen',
  options: { cut: boolean; drawer: boolean }
): Uint8Array {
  const encoder = new EscPosEncoder().init();
  encoder.encodeLines(buildReceiptLines(sale, settings, copy), paperCols(settings.paper_width_mm || 80));
  encoder.feed(Math.max(1, Number(settings.feed_lines_before_cut) || 4));
  if (options.cut && settings.auto_cut) {
    encoder.cut(settings.cut_mode === 'full' ? 'full' : 'partial');
  }
  if (options.drawer && settings.open_cash_drawer && sale.payment_method === 'cash') {
    encoder.cashDrawer();
  }
  return encoder.bytes();
}

export async function sendEscPos(data: Uint8Array, baudRate = 9600): Promise<void> {
  if (!activePort) {
    const ok = await reconnectThermalPrinter(baudRate);
    if (!ok || !activePort) {
      throw new Error('Thermal printer is not connected. Open Settings and tap Connect Printer.');
    }
  }
  try {
    await writeBytes(activePort, data);
  } catch (err) {
    activePort = null;
    throw err;
  }
}

export async function printSaleOnThermal(
  sale: Sale,
  settings: StoreSettings,
  options?: { copies?: number; kitchen?: boolean }
): Promise<void> {
  const copies = Math.max(1, options?.copies ?? settings.print_copies ?? 1);
  const baud = settings.printer_baud_rate || 9600;
  for (let i = 0; i < copies; i++) {
    await sendEscPos(
      encodeJob(sale, settings, 'customer', { cut: true, drawer: i === 0 }),
      baud
    );
  }
  if (options?.kitchen ?? settings.print_kitchen_copy) {
    await sendEscPos(encodeJob(sale, settings, 'kitchen', { cut: true, drawer: false }), baud);
  }
}

export async function testPrintAndCut(settings: StoreSettings): Promise<void> {
  const encoder = new EscPosEncoder().init();
  encoder
    .align('center')
    .bold(true)
    .double(true)
    .line(settings.business_name || 'FRESH BITES')
    .double(false)
    .bold(false)
    .line('Printer test')
    .line(`${settings.paper_width_mm || 80}mm  |  cut: ${settings.cut_mode}`)
    .line(new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))
    .feed(Math.max(2, Number(settings.feed_lines_before_cut) || 4));
  if (settings.auto_cut) encoder.cut(settings.cut_mode === 'full' ? 'full' : 'partial');
  if (settings.open_cash_drawer) encoder.cashDrawer();
  await sendEscPos(encoder.bytes(), settings.printer_baud_rate || 9600);
}

export function printSaleInBrowser(): void {
  window.print();
}

export async function printCompletedSale(sale: Sale, settings: StoreSettings): Promise<'escpos' | 'browser'> {
  if (settings.printer_connection === 'escpos' && hasWebSerial()) {
    try {
      await printSaleOnThermal(sale, settings);
      return 'escpos';
    } catch (err) {
      console.warn('ESC/POS print failed, falling back to browser print', err);
    }
  }
  printSaleInBrowser();
  return 'browser';
}
