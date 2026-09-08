'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useOrder } from '@/lib/context/OrderContext';
import { SITE_CONFIG } from '@/lib/config';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams.id;
  const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

  const { orders, ownerSignature } = useOrder();
  const [copied, setCopied] = useState(false);

  // Find order in memory or default
  const order = orders.find(
    (o) => o.id.toLowerCase() === orderId.toLowerCase() || o.id.replace('MC-', '') === rawId
  );

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const invoiceUrl = typeof window !== 'undefined' ? window.location.href : `https://marine-creatures-sand.vercel.app/invoice/${order.id}`;
    const text = `🌊 *MARINE CREATURES — OFFICIAL TAX INVOICE & DISPATCH MANIFEST* 🌊\n\nDear *${order.customerName}*,\nYour order *#${order.id}* has been verified & approved.\n\n🧾 *Invoice No:* ${order.invoiceNumber || `INV-${order.id}`}\n📅 *Date:* ${order.approvedAt || order.createdAt}\n📦 *Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')} (All-inclusive)\n📍 *Delivery Address:* ${order.address}, ${order.city} (${order.pincode})\n✈️ *Carrier:* ${order.courierName || 'Priority Air Cargo Express'} ${order.awbNumber ? `(AWB: ${order.awbNumber})` : ''}\n\n📄 *View / Download Your Official Invoice:* \n${invoiceUrl}\n\nThank you for trusting Marine Creatures with your bespoke marine ecosystem!`;
    const phone = order.phone ? order.phone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#02070c] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#071520] border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <span className="text-4xl block">🧾</span>
          <h2 className="text-xl font-bold text-white">Invoice Not Found</h2>
          <p className="text-xs text-slate-400">
            No order matching reference <span className="text-cyan-400 font-mono font-bold">#{orderId}</span> was located in the registry.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider"
            >
              Explore Storefront
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Strict packaging guard: Invoice is only generated after order is marked as Packed (Stage 3) or later
  const isPackedOrLater = ['packed', 'dispatched', 'delivered'].includes(order.currentStep);

  if (!isPackedOrLater) {
    return (
      <div className="marine-invoice-view min-h-screen bg-[#02070c] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#071520] border border-amber-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
            📦
          </div>
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
              Packaging Verification Required
            </span>
            <h2 className="text-xl font-black text-white tracking-wide">
              Invoice Locked Until Packed
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official Tax Invoices are strictly released only after livestock completes quarantine and is verified and sealed in <strong className="text-slate-200">Stage 3: Thermal Pod Packaging</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Order Ref:</span>
              <span className="font-mono font-bold text-cyan-400">#{order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Customer:</span>
              <span className="font-semibold text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current Milestone:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium capitalize">
                {order.currentStep === 'placed' ? 'Step 1: Order Placed' : 'Step 2: Quarantine Clearance'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-500">Unlocks At:</span>
              <span className="text-emerald-400 font-bold">Step 3: Thermal Pod Packed 📦</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all"
            >
              ← Storefront
            </Link>
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoiceNumber = order.invoiceNumber || `INV-${order.id}`;
  const invoiceDate = order.approvedAt || order.createdAt;

  // Amount in words calculation helper
  const numberToWords = (num: number): string => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    return `${num}`;
  };

  return (
    <div className="marine-invoice-view min-h-screen bg-[#02070c] py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center">
      {/* Top Action Bar (Hidden during print) */}
      <div className="w-full max-w-4xl mb-5 flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            className="h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>←</span>
            <span>Storefront</span>
          </Link>
          <Link
            href="/admin"
            className="h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>⚙️</span>
            <span>Admin Orders</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>🔗</span>
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>💬</span>
            <span>Send to Client WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Tax Invoice Sheet */}
      <div
        id="tax-invoice-sheet"
        className="w-full max-w-4xl bg-[#071520] text-slate-200 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:rounded-none"
      >
        {/* Header: Company Insignia & Registry Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800 print:border-black/20">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-cyan-400/40 bg-white flex-shrink-0 shadow-lg print:border-black/30">
                <Image
                  src="/logo.jpg"
                  alt="Marine Creatures Official Emblem"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider print:text-black uppercase">
                  Marine Creatures
                </h1>
                <p className="text-[11px] font-semibold text-cyan-400 print:text-slate-700 tracking-widest uppercase">
                  Bespoke Ocean Systems &amp; Captive-Bred Livestock
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 print:text-slate-600 space-y-0.5 pt-2 leading-relaxed">
              <p className="font-semibold text-slate-300 print:text-black">Marine Creatures Aquatics Private Limited</p>
              <p>Registered Studio: {SITE_CONFIG.address}</p>
              <p>Hotline: {SITE_CONFIG.phone} | Support: {SITE_CONFIG.email}</p>
              <p className="font-mono text-[11px] text-slate-400 print:text-slate-600">
                Registry: <span className="font-bold text-slate-300 print:text-black">Kolkata, West Bengal</span> • Live Marine Cargo Permitted
              </p>
            </div>
          </div>

          {/* Invoice Badge Block */}
          <div className="sm:text-right space-y-2">
            <div className="inline-block px-3.5 py-1 rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs uppercase tracking-wider print:bg-slate-100 print:text-black print:border-black/30">
              Tax Invoice &amp; Live Manifest
            </div>

            <div className="text-xs space-y-1">
              <p>
                <span className="text-slate-400 print:text-slate-600">Invoice No:</span>{' '}
                <span className="font-mono font-bold text-white print:text-black">{invoiceNumber}</span>
              </p>
              <p>
                <span className="text-slate-400 print:text-slate-600">Invoice Date:</span>{' '}
                <span className="font-mono text-slate-300 print:text-black">{invoiceDate}</span>
              </p>
              <p>
                <span className="text-slate-400 print:text-slate-600">Order Ref:</span>{' '}
                <span className="font-mono font-bold text-cyan-400 print:text-black">#{order.id}</span>
              </p>
              <p>
                <span className="text-slate-400 print:text-slate-600">Status:</span>{' '}
                <span className={`font-bold ${order.isApproved ? 'text-emerald-400 print:text-black' : 'text-amber-400 print:text-black'}`}>
                  {order.isApproved ? '✓ APPROVED & VERIFIED' : '● PENDING CONCIERGE APPROVAL'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Consignee / Billed To Block & Transit Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Client Details */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 print:bg-slate-50 print:border-black/20 space-y-1.5">
            <span className="text-[10px] font-bold text-cyan-400 print:text-black uppercase tracking-wider block mb-1">
              Billed To / Consignee
            </span>
            <p className="text-sm font-bold text-white print:text-black">
              👤 {order.customerName}
            </p>
            <p className="text-slate-300 print:text-slate-800">
              📞 +91 {order.phone}
            </p>
            <p className="text-slate-300 print:text-slate-800 leading-relaxed">
              📍 <span className="font-medium">{order.address}</span>
            </p>
            <p className="text-slate-400 print:text-slate-600 font-medium">
              City &amp; PIN: {order.city} - {order.pincode}
            </p>
            {order.orderNotes && (
              <p className="text-[11px] text-amber-300/90 print:text-black italic pt-1">
                Note: {order.orderNotes}
              </p>
            )}
          </div>

          {/* Transit & Air Cargo Manifest */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 print:bg-slate-50 print:border-black/20 space-y-1.5">
            <span className="text-[10px] font-bold text-cyan-400 print:text-black uppercase tracking-wider block mb-1">
              Live Air Cargo Dispatch Details
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 pt-0.5">
              <div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Carrier Partner</span>
                <span className="font-semibold text-white print:text-black">
                  {order.courierName || 'IndiGo CarGo Priority'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Air Waybill (AWB)</span>
                <span className="font-mono font-bold text-cyan-300 print:text-black">
                  {order.awbNumber || 'EXP-AIR-PENDING'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Est. Delivery</span>
                <span className="text-white print:text-black">{order.estimatedDelivery}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Packaging Standard</span>
                <span className="text-emerald-400 print:text-black font-semibold">Climate Thermal Pod</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Specimens Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-black/30">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider print:bg-slate-100 print:text-black print:border-black/30">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Specimen / Marine Item Description</th>
                <th className="p-3 text-center">HSN/SAC</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Rate</th>
                <th className="p-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-black/20">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 print:hover:bg-transparent">
                  <td className="p-3 text-center font-mono text-slate-500 print:text-slate-700">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-white print:text-black text-xs sm:text-sm">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600">
                      Category: {item.product.categoryLabel}
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-400 print:text-slate-700">0301</td>
                  <td className="p-3 text-center font-mono font-bold text-white print:text-black">{item.quantity}</td>
                  <td className="p-3 text-right font-mono text-slate-300 print:text-black">
                    ₹{item.product.price.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-cyan-300 print:text-black">
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation & Breakdown */}
        <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
          {/* Terms & Acclimation Guarantee */}
          <div className="flex-1 space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 print:bg-slate-50 print:border-black/20 text-[11px] leading-relaxed">
              <span className="font-bold text-emerald-400 print:text-black uppercase block mb-1">
                🔒 48-Hour Live Arrival Guarantee (LAG) Active
              </span>
              <p className="text-slate-400 print:text-slate-700">
                Specimens are packed in specialized medical-grade pure oxygen bags inside multi-layer thermal polystyrene pods. Acclimate slowly via drip transfer method over 45 minutes upon unboxing.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 print:text-slate-600 italic">
              * In Words: <span className="font-semibold text-slate-300 print:text-black capitalize">{numberToWords(order.totalAmount)} Rupees Only</span>
            </div>
          </div>

          {/* Totals Table */}
          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80 print:border-black/20">
              <span className="text-slate-400 print:text-slate-600">Specimen Subtotal:</span>
              <span className="font-mono font-semibold text-white print:text-black">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80 print:border-black/20">
              <span className="text-slate-400 print:text-slate-600">Applicable Taxes &amp; Packaging:</span>
              <span className="font-mono text-emerald-400 print:text-black font-semibold">
                Included (₹0 Extra)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80 print:border-black/20">
              <span className="text-slate-400 print:text-slate-600">Thermal Pod Packaging:</span>
              <span className="text-emerald-400 print:text-black font-semibold">FREE (₹0)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80 print:border-black/20">
              <span className="text-slate-400 print:text-slate-600">Priority Cargo Air Transit:</span>
              <span className="text-emerald-400 print:text-black font-semibold">FREE (₹0)</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-bold bg-cyan-400/10 print:bg-slate-100 p-2.5 rounded-xl">
              <span className="text-white print:text-black">Total Amount Payable:</span>
              <span className="text-base text-cyan-300 print:text-black font-mono">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Signatory & Embossed Seal Block */}
        <div className="pt-6 border-t border-slate-800 print:border-black/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Official Company Seal Stamp */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-400/60 print:border-black flex flex-col items-center justify-center p-1 text-center shadow-[0_0_15px_rgba(0,184,217,0.2)] print:shadow-none">
              <span className="text-[7px] font-black uppercase text-cyan-400 print:text-black tracking-widest leading-none">
                MARINE CREATURES
              </span>
              <span className="text-base leading-none py-0.5">🌊</span>
              <span className="text-[6px] font-bold text-emerald-400 print:text-black tracking-wider leading-none">
                VERIFIED SEAL
              </span>
            </div>
            <div className="text-[10px] text-slate-400 print:text-slate-600 leading-tight">
              <p className="font-bold text-slate-300 print:text-black uppercase">Official Dispatch Accreditation</p>
              <p>Government Registered Aquaculture Vendor</p>
              <p className="text-[9px] font-mono opacity-80">Ref Code: MC-DOA-AUTHENTIC</p>
            </div>
          </div>

          {/* Owner Signature Block */}
          <div className="text-right sm:pr-4 flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 print:text-slate-600 block mb-1">
              For Marine Creatures Aquatics Pvt. Ltd.
            </span>

            {/* Signature Graphic: uploaded custom image or default authentic handwritten signature */}
            <div className="h-16 flex items-center justify-end py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ownerSignature || '/signature.png'}
                alt="Authorized Signature - Suraj Shasmal"
                className="max-h-14 max-w-[170px] object-contain rounded-lg p-1 bg-white/95 border border-slate-700/40 shadow-sm print:bg-transparent print:border-none print:shadow-none print:p-0 print:mix-blend-multiply"
              />
            </div>

            <div className="border-t border-slate-700 print:border-black pt-1 w-44 text-right">
              <span className="text-xs font-bold text-white print:text-black block leading-tight">
                Authorized Signatory
              </span>
              <span className="text-[10px] text-slate-400 print:text-slate-600 leading-none">
                Founder &amp; Master Aquarist
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-[10px] text-slate-500 print:text-slate-600 text-center pt-4 border-t border-slate-800/40 print:border-none leading-relaxed">
          This is a computer-generated luxury tax invoice and dispatch certificate requiring no physical stamp.
          Nurtured in CODEVERSE • Kolkata, India.
        </div>
      </div>
    </div>
  );
}
