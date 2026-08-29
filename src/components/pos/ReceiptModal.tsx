'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sale, StoreSettings } from '@/types/pos';
import { Printer, CheckCircle, X, PlusCircle, MessageCircle } from 'lucide-react';
import { buildReceiptLines, receiptWhatsAppText } from '@/lib/print/receipt';
import { printCompletedSale, printSaleInBrowser, printSaleOnThermal, hasWebSerial } from '@/lib/print/thermalPrinter';
import { paperCols } from '@/lib/print/escpos';
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
  const cols = paperCols(settings.paper_width_mm || 80);
  const widthClass = settings.paper_width_mm === 58 ? 'max-w-[240px]' : 'max-w-[320px]';

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
    } catch (err: any) {
      printSaleInBrowser();
      if (!silent) toast.error(err.message || 'Print failed — using browser print');
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
    } catch (err: any) {
      toast.error(err.message || 'Printer not connected');
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/75 p-0 backdrop-blur-sm select-none sm:items-center sm:p-3">
      <div className="flex max-h-[100dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:max-h-[95dvh] sm:rounded-2xl">
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

        <div className="flex justify-center overflow-y-auto bg-emerald-50/50 p-4">
          <div
            id="thermal-receipt"
            data-paper={settings.paper_width_mm || 80}
            className={`w-full ${widthClass} border border-stone-200 bg-white p-3 font-mono text-[12px] leading-tight text-stone-950 shadow-sm select-text`}
            style={{ maxWidth: settings.paper_width_mm === 58 ? '58mm' : '80mm' }}
          >
            {lines.map((line, idx) => {
              if (line.kind === 'sep') {
                return (
                  <div key={idx} className="my-1 overflow-hidden text-stone-400">
                    {'-'.repeat(cols)}
                  </div>
                );
              }
              if (line.kind === 'blank') return <div key={idx} className="h-2" />;
              if (line.kind === 'row') {
                return (
                  <div key={idx} className={`flex justify-between gap-2 ${line.bold ? 'font-black' : ''}`}>
                    <span>{line.left}</span>
                    <span className="shrink-0">{line.right}</span>
                  </div>
                );
              }
              const align =
                line.align === 'center' ? 'text-center' : line.align === 'right' ? 'text-right' : 'text-left';
              return (
                <div
                  key={idx}
                  className={`${align} ${line.bold ? 'font-black' : ''} ${line.double ? 'text-sm tracking-wide' : ''}`}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-emerald-100 bg-white p-3">
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
              Send on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
