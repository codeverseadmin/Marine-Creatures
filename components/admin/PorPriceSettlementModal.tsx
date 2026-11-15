'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CustomerOrder, OrderItem } from '@/lib/context/OrderContext';

export interface PorPriceSettlementModalProps {
  order: CustomerOrder;
  isOpen: boolean;
  onClose: () => void;
  onSavePricing: (
    itemsToUpdate: Array<{ id: string; name: string; agreedUnitPrice: number }>,
    isFullSettlement: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  onInvoiceGenerated?: (orderId: string) => void;
}

export default function PorPriceSettlementModal({
  order,
  isOpen,
  onClose,
  onSavePricing,
  onInvoiceGenerated,
}: PorPriceSettlementModalProps) {
  // Map of item identifier -> raw string input
  const [pricingInputs, setPricingInputs] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'partial' | 'full' | null>(null);

  // Initialize input values from order items
  useEffect(() => {
    if (!order) return;
    const initialInputs: Record<string, string> = {};
    (order.items || []).forEach((item) => {
      const key = (item as any).id || item.product?.id || (item as any)._id;
      const originalPrice = typeof (item as any).price === 'number' ? (item as any).price : (typeof item.product?.price === 'number' ? item.product.price : 0);
      if (typeof item.agreedUnitPrice === 'number' && item.agreedUnitPrice > 0) {
        initialInputs[key] = String(item.agreedUnitPrice);
      } else if (originalPrice > 0 && !item.priceOnRequest && item.pricingStatus !== 'PENDING_POR') {
        initialInputs[key] = String(originalPrice);
      } else {
        initialInputs[key] = '';
      }
    });
    setPricingInputs(initialInputs);
    setValidationErrors({});
    setGeneralError(null);
  }, [order]);

  // Keyboard navigation: Escape closes modal if not saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Compute pending vs confirmed status per line item
  const lineItemCalculations = useMemo(() => {
    if (!order || !order.items) return [];

    return order.items.map((item) => {
      const key = (item as any).id || item.product?.id || (item as any)._id;
      const itemName = (item as any).name || item.product?.name || 'Specimen';
      const originalPrice = typeof (item as any).price === 'number' ? (item as any).price : (typeof item.product?.price === 'number' ? item.product.price : 0);
      const rawInput = pricingInputs[key] ?? '';
      const trimmed = rawInput.trim();
      const numVal = parseFloat(trimmed);

      const isPor = Boolean(
        item.priceOnRequest ||
        item.pricingStatus === 'PENDING_POR' ||
        originalPrice === 0
      );

      const isValidPositive = !isNaN(numVal) && numVal > 0 && isFinite(numVal);
      const isConfirmed = isPor
        ? isValidPositive
        : true; // Catalog items are already priced

      const effectiveUnitPrice = isValidPositive
        ? Math.round(numVal * 100) / 100
        : (!isPor && originalPrice > 0 ? originalPrice : 0);

      const lineTotal = effectiveUnitPrice * (item.quantity || 1);

      return {
        item,
        key,
        itemName,
        originalPrice,
        rawInput,
        numVal,
        isPor,
        isValidPositive,
        isConfirmed,
        effectiveUnitPrice,
        lineTotal,
        variant:
          (item as any).variant ||
          (item.product as any)?.variant ||
          item.product?.variants?.[0]?.name ||
          (item as any).category ||
          'Standard Specimen',
      };
    });
  }, [order, pricingInputs]);

  // Recalculated Order Totals
  const { subtotal, couponDiscount, finalTotal, pendingPorCount, totalPorCount } = useMemo(() => {
    let sub = 0;
    let pendingCount = 0;
    let porCount = 0;

    lineItemCalculations.forEach((line) => {
      sub += line.lineTotal;
      if (line.isPor) {
        porCount++;
        if (!line.isValidPositive) {
          pendingCount++;
        }
      }
    });

    const discount = order?.coupon?.discountAmount || 0;
    const final = Math.max(0, Math.round((sub - discount) * 100) / 100);

    return {
      subtotal: Math.round(sub * 100) / 100,
      couponDiscount: discount,
      finalTotal: final,
      pendingPorCount: pendingCount,
      totalPorCount: porCount,
    };
  }, [lineItemCalculations, order]);

  if (!isOpen || !order) return null;

  // Validate a single price input
  const validatePrice = (val: string): { valid: boolean; error?: string; num?: number } => {
    const trimmed = val.trim();
    if (!trimmed) {
      return { valid: false, error: 'Price cannot be empty.' };
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid numeric amount.' };
    }
    if (num <= 0) {
      return { valid: false, error: 'Price must be greater than ₹0.00.' };
    }
    if (num > 100000000) {
      return { valid: false, error: 'Price exceeds maximum permissible limit.' };
    }
    return { valid: true, num: Math.round(num * 100) / 100 };
  };

  const handleInputChange = (key: string, val: string) => {
    setPricingInputs((prev) => ({ ...prev, [key]: val }));
    setGeneralError(null);

    // Validate on change if previously errored
    if (validationErrors[key]) {
      const res = validatePrice(val);
      if (res.valid) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  // ── PARTIAL SETTLEMENT: Save entered prices without generating invoice ────
  const handleSavePartial = async () => {
    setGeneralError(null);
    const errors: Record<string, string> = {};
    const updates: Array<{ id: string; name: string; agreedUnitPrice: number }> = [];

    // Collect all entered items
    lineItemCalculations.forEach((line) => {
      const raw = line.rawInput.trim();
      if (raw) {
        const valRes = validatePrice(raw);
        if (!valRes.valid) {
          errors[line.key] = valRes.error!;
        } else if (line.isPor) {
          updates.push({
            id: line.key,
            name: line.itemName,
            agreedUnitPrice: valRes.num!,
          });
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setGeneralError('Please resolve the invalid price inputs highlighted below.');
      return;
    }

    if (updates.length === 0) {
      setGeneralError('Please enter at least one agreed price to save partial progress.');
      return;
    }

    setIsSaving(true);
    setSaveMode('partial');
    try {
      const res = await onSavePricing(updates, false);
      if (!res.success) {
        setGeneralError(res.error || 'Failed to save partial pricing.');
      }
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
      setSaveMode(null);
    }
  };

  // ── FULL SETTLEMENT & INVOICE GENERATION ──────────────────────────────────
  const handleConfirmAndGenerateInvoice = async () => {
    setGeneralError(null);
    const errors: Record<string, string> = {};
    const updates: Array<{ id: string; name: string; agreedUnitPrice: number }> = [];

    // Every POR item must have a valid price > 0
    lineItemCalculations.forEach((line) => {
      if (line.isPor) {
        const raw = line.rawInput.trim();
        const valRes = validatePrice(raw);
        if (!valRes.valid) {
          errors[line.key] = valRes.error!;
        } else {
          updates.push({
            id: line.key,
            name: line.itemName,
            agreedUnitPrice: valRes.num!,
          });
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setGeneralError('All pending items must have a valid positive price before generating the official invoice.');
      return;
    }

    setIsSaving(true);
    setSaveMode('full');
    try {
      const res = await onSavePricing(updates, true);
      if (res.success) {
        onClose();
        if (onInvoiceGenerated) {
          onInvoiceGenerated(order.id);
        }
      } else {
        setGeneralError(res.error || 'Failed to finalize pricing and generate invoice.');
      }
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
      setSaveMode(null);
    }
  };

  const isAllSettled = pendingPorCount === 0 && totalPorCount > 0;
  const hasAtLeastOneFilled = lineItemCalculations.some(
    (l) => l.isPor && l.rawInput.trim() !== ''
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="por-settlement-title"
      aria-describedby="por-settlement-subtitle"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl bg-[#051119] border border-cyan-400/40 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 text-white max-h-[92vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400" />

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-9 h-9 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center text-lg font-bold">
                ⚖️
              </span>
              <h2 id="por-settlement-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Settle Pending Product Pricing
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                #{order.id}
              </span>
            </div>
            <p id="por-settlement-subtitle" className="text-xs sm:text-sm text-slate-300">
              Confirm the agreed prices for all pending items before generating the official invoice.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap pt-0.5">
              <span>Customer: <strong className="text-white font-medium">{order.customerName}</strong></span>
              <span>•</span>
              <span>Destination: <strong className="text-white font-medium">{order.city}</strong></span>
              <span>•</span>
              <span className="text-amber-400 font-semibold font-mono">
                {pendingPorCount === 0 ? '✓ All Items Priced' : `${pendingPorCount} of ${totalPorCount} item(s) pending`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close settlement modal"
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors disabled:opacity-40 shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* ── General Alert Banner ───────────────────────────────────────── */}
        {generalError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs sm:text-sm text-rose-300 flex items-center gap-2.5 shrink-0 animate-in fade-in">
            <span className="text-base shrink-0">⚠️</span>
            <span className="font-medium leading-relaxed">{generalError}</span>
          </div>
        )}

        {/* ── Responsive Line Items Table ─────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="overflow-x-auto rounded-2xl border border-slate-800/90 bg-slate-950/70">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800/90 bg-[#071724]/90 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th scope="col" className="py-3 px-3.5 sm:px-4">Product</th>
                  <th scope="col" className="py-3 px-2 sm:px-3">Variant</th>
                  <th scope="col" className="py-3 px-2 sm:px-3 text-center">Quantity</th>
                  <th scope="col" className="py-3 px-2 sm:px-3 text-right">Original Price</th>
                  <th scope="col" className="py-3 px-2 sm:px-3 text-right min-w-[140px]">Agreed Unit Price</th>
                  <th scope="col" className="py-3 px-2 sm:px-3 text-right">Line Total</th>
                  <th scope="col" className="py-3 px-3 sm:px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {lineItemCalculations.map((line) => {
                  const { item, key, itemName, originalPrice, isPor, lineTotal, variant, isConfirmed } = line;
                  const err = validationErrors[key];
                  const imgUrl = (item as any).image || item.product?.images?.[0] || '/images/products/placeholder.jpg';

                  return (
                    <tr
                      key={key}
                      className={`transition-colors ${
                        isPor
                          ? isConfirmed
                            ? 'bg-slate-900/40 hover:bg-slate-900/60'
                            : 'bg-amber-950/15 hover:bg-amber-950/25'
                          : 'bg-slate-950/30 hover:bg-slate-900/40'
                      }`}
                    >
                      {/* 1. Product Name & Thumb */}
                      <td className="py-3 px-3.5 sm:px-4">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <img
                            src={imgUrl}
                            alt={itemName}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700/60 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white truncate block text-xs sm:text-sm">
                              {itemName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              ID: {key}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Variant */}
                      <td className="py-3 px-2 sm:px-3 text-slate-300 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
                          {variant}
                        </span>
                      </td>

                      {/* 3. Quantity */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 font-mono font-bold text-white text-xs">
                          {item.quantity}
                        </span>
                      </td>

                      {/* 4. Original Price */}
                      <td className="py-3 px-2 sm:px-3 text-right">
                        {isPor ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                            POR
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* 5. Agreed Unit Price (Editable Input) */}
                      <td className="py-3 px-2 sm:px-3 text-right">
                        <div className="flex flex-col items-end">
                          <div className="relative w-32 sm:w-36">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder={isPor ? 'Enter price' : 'Fixed'}
                              disabled={!isPor || isSaving}
                              value={pricingInputs[key] ?? ''}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              className={`w-full h-10 pl-7 pr-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold text-right transition-all focus:outline-none ${
                                !isPor
                                  ? 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-not-allowed'
                                  : err
                                  ? 'bg-rose-950/30 border-rose-500 text-rose-200 focus:border-rose-400'
                                  : isConfirmed
                                  ? 'bg-slate-900 border-emerald-500/50 text-emerald-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30'
                                  : 'bg-slate-900 border-amber-500/50 text-amber-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30'
                              } border shadow-inner`}
                            />
                          </div>
                          {err && (
                            <span className="text-[10px] text-rose-400 mt-1 font-medium text-right block">
                              {err}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Line Total */}
                      <td className="py-3 px-2 sm:px-3 text-right font-mono font-bold text-xs sm:text-sm text-cyan-300">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        {isPor ? (
                          isConfirmed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px] font-medium">
                            Catalog
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recalculated Financial Summary Card ─────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#061926] border border-cyan-500/30 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800/80">
            <span className="font-semibold text-slate-200">Financial Settlement Summary:</span>
            <span className="font-mono text-cyan-400 font-bold">
              {lineItemCalculations.length} total line item(s) • {totalPorCount} POR item(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Subtotal */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Recalculated Subtotal
              </span>
              <span className="font-mono text-base font-bold text-white block">
                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Discounts */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Coupon / Adjustment
              </span>
              {couponDiscount > 0 ? (
                <span className="font-mono text-base font-bold text-emerald-400 block">
                  - ₹{couponDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {order.coupon?.code && (
                    <span className="text-[10px] text-slate-400 ml-1 font-normal">
                      ({order.coupon.code})
                    </span>
                  )}
                </span>
              ) : (
                <span className="font-mono text-base font-medium text-slate-500 block">
                  ₹0.00 (None)
                </span>
              )}
            </div>

            {/* Total Order Amount */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50">
              <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold block mb-1">
                Final Payable Total (INR)
              </span>
              <span className="font-mono text-lg sm:text-xl font-extrabold text-cyan-300 block">
                ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons Footer ───────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>🔒</span>
            <span>Server-side RBAC &amp; audit logging enforced.</span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 min-h-[44px]"
            >
              Cancel
            </button>

            {/* Partial Settlement Save */}
            <button
              type="button"
              onClick={handleSavePartial}
              disabled={isSaving || !hasAtLeastOneFilled}
              className="h-11 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 min-h-[44px]"
              title="Save entered prices without generating the official invoice"
            >
              {isSaving && saveMode === 'partial' ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Saving Progress…</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Progress (Partial)</span>
                </>
              )}
            </button>

            {/* Full Settlement & Generate Invoice */}
            <button
              type="button"
              onClick={handleConfirmAndGenerateInvoice}
              disabled={isSaving || pendingPorCount > 0}
              className={`h-11 px-5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-95 min-h-[44px] ${
                pendingPorCount === 0 && !isSaving
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
              }`}
              title={
                pendingPorCount > 0
                  ? `Cannot generate invoice: ${pendingPorCount} item(s) still require agreed pricing`
                  : 'Confirm pricing and generate official tax invoice'
              }
            >
              {isSaving && saveMode === 'full' ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Generating Invoice…</span>
                </>
              ) : (
                <>
                  <span>🧾</span>
                  <span>Confirm &amp; Generate Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
