'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sale, StoreSettings } from '@/types/pos';
import { Printer, CheckCircle, X, PlusCircle, MessageCircle } from 'lucide-react';
import { buildReceiptLines, receiptWhatsAppText } from '@/lib/print/receipt';
import { printCompletedSale, printSaleInBrowser, printSaleOnThermal, hasWebSerial } from '@/lib/print/thermalPrinter';
import { toast } from 'sonner';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: StoreSettings;
  onStartNewOrder: () => void;
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('92') ? digits : digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function ReceiptModal({
  isOpen,
  onClose,
  sale,
  settings,
  onStartNewOrder,
}: ReceiptModalProps) {
  const printedFor = useRef<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const paperMm = settings.paper_width_mm === 58 ? 58 : 80;

  const handlePrint = async (silent = false) => {
    if (!sale) return;
    setPrinting(true);
    try {
      const mode = await printCompletedSale(sale, settings);
      if (!silent) {
        toast.success(
          mode === 'escpos'
            ? settings.auto_cut
              ? 'Printed and paper cut'
              : 'Sent to thermal printer'
            : 'Print dialog opened'
        );
      }
    } catch (err: unknown) {
      printSaleInBrowser();
      if (!silent) {
        toast.error(err instanceof Error ? err.message : 'Print failed — using browser print');
      }
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        void handlePrint();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onClose();
        onStartNewOrder();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sale?.id, onClose, onStartNewOrder]);

  useEffect(() => {
    if (!isOpen || !sale || !settings.auto_print) return;
    if (printedFor.current === sale.id) return;
    printedFor.current = sale.id;
    const timer = window.setTimeout(() => {
      void handlePrint(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isOpen, sale?.id, settings.auto_print]);

  if (!isOpen || !sale) return null;

  const lines = buildReceiptLines(sale, settings, 'customer');

  async function handleRawAgain() {
    if (!sale) return;
    setPrinting(true);
    try {
      if (hasWebSerial() && settings.printer_connection === 'escpos') {
        await printSaleOnThermal(sale, settings);
        toast.success(settings.auto_cut ? 'Printed and paper cut' : 'Sent to thermal printer');
      } else {
        printSaleInBrowser();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Printer not connected');
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs select-none overflow-hidden">
      <div className="flex h-full max-h-[88dvh] sm:max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-100">
        <div className="flex shrink-0 items-center justify-between bg-emerald-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            <h2 className="text-xs font-extrabold tracking-wider uppercase">
              {sale.token_number ? `Token ${sale.token_number}` : 'Sale completed'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto bg-stone-200/80 p-3 sm:p-4">
          <div className="mx-auto w-fit max-w-full">
            <div
              id="thermal-receipt"
              data-paper={paperMm}
              className="overflow-hidden border border-stone-300 bg-white px-2 py-2 text-black shadow-sm select-text rounded-sm"
              style={{ width: paperMm === 58 ? '52mm' : '72mm', maxWidth: '100%' }}
            >
              {lines.map((line, idx) => {
                if (line.kind === 'title') {
                  return (
                    <div key={idx} className="slip-title">
                      {line.text}
                    </div>
                  );
                }
                if (line.kind === 'sep') {
                  return <div key={idx} className="slip-sep" />;
                }
                if (line.kind === 'blank') return <div key={idx} className="h-2" />;
                if (line.kind === 'row') {
                  return (
                    <div key={idx} className={`slip-row ${line.bold ? 'slip-strong' : ''}`}>
                      <span className="slip-lab">{line.left}</span>
                      <span className="slip-val">{line.right}</span>
                    </div>
                  );
                }
                const align =
                  line.align === 'center' ? 'slip-center' : line.align === 'right' ? 'slip-right' : 'slip-left';
                return (
                  <div key={idx} className={`${align} ${line.bold ? 'slip-strong' : ''}`}>
                    {line.text}
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-center text-[9px] font-medium text-stone-500">
              {paperMm}mm receipt · name and amount on one line
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-stone-200 bg-white p-3 shadow-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleRawAgain()}
              disabled={printing}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white transition hover:bg-stone-800 disabled:opacity-60"
            >
              <Printer className="size-3.5 text-stone-300" />
              <span>{printing ? 'Printing…' : 'Print + Cut'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartNewOrder();
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              <PlusCircle className="size-3.5" />
              <span>Next order</span>
            </button>
          </div>
          {sale.customer_phone && (
            <a
              href={waLink(sale.customer_phone, receiptWhatsAppText(sale, settings))}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-800"
            >
              <MessageCircle className="size-3.5" />
              <span>Send on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Browser/Windows POS-80 print uses #thermal-receipt only */}
    </div>
  );
}
