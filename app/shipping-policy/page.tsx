import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Shipping & Purchase Policy',
  description:
    'Authoritative shipping terms, live transit conditions, airport-to-airport cargo dispatch, and DOA guarantee protocols for Marine Creatures livestock and equipment.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/shipping-policy`,
  },
  openGraph: {
    title: 'Shipping & Purchase Policy | Marine Creatures',
    description:
      'Authoritative transit conditions, live cargo dispatch protocols, and live arrival guarantee terms.',
    url: `${SITE_CONFIG.url}/shipping-policy`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shipping & Purchase Policy | Marine Creatures',
    description:
      'Live cargo transit terms, packaging protocols, and arrival guarantee.',
  },
};

export default function ShippingPolicyPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: 'Shipping Policy', url: '/shipping-policy' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <div
      style={{ background: 'var(--color-primary)', minHeight: '100vh', paddingTop: '130px' }}
      className="pb-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container-max">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 pb-6 mb-8 border-b border-white/10 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <span className="opacity-40">/</span>
          <span className="text-[var(--color-accent)] font-medium">Shipping &amp; Purchase Policy</span>
        </div>

        {/* Header Hero */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-cyan-400 block mb-3">
            AUTHORITATIVE TRANSIT &amp; SALES DIRECTIVE
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-white font-light leading-tight mb-4">
            Shipping &amp; Purchase Policy
          </h1>
          <p className="font-body text-sm sm:text-base text-slate-300 leading-relaxed">
            These terms define transit conditions, live arrival boundaries, and commercial rules governing all Marine Creatures transactions. By placing an order, booking specimens, or completing an invoice, buyers acknowledge and accept these authoritative stipulations.
          </p>
        </div>

        {/* Policy Grid */}
        <div className="max-w-4xl space-y-8">
          {/* 1. Live Transit & DOA Coverage */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                01
              </span>
              <h2 className="text-lg sm:text-xl font-display text-white font-normal">
                Transit Modes &amp; Live Arrival (DOA) Terms
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-0 sm:pl-11">
              <p>
                All livestock undergoes meticulous quarantine husbandry and active feeding acclimation prior to dispatch. Packaging utilizes specialized insulated containers pressurized with pure medicinal oxygen.
              </p>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 space-y-1.5">
                <strong className="block text-amber-300 font-semibold uppercase tracking-wider text-xs">
                  CRITICAL TRANSIT RULE:
                </strong>
                <p>
                  <strong>NO DOA IN RAILWAY AND BUS SHIPPING.</strong> Under no circumstances does Marine Creatures provide Dead On Arrival (DOA) replacement, credit, or reimbursement for orders dispatched via railway or inter-city bus transit. Buyers choosing surface road/rail methods do so entirely at their own risk.
                </p>
              </div>
              <p>
                <strong>Priority Air Cargo:</strong> Live arrival coverage applies strictly to designated express air cargo flights. Consignments must be collected from the destination airport cargo terminal within 2 hours of flight arrival. Clear, unedited video footage of any casualty taken inside the original sealed packaging within 1 hour of collection is mandatory for claim consideration.
              </p>
            </div>
          </div>

          {/* 2. Commercial Returns, Exchange & Credit */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                02
              </span>
              <h2 className="text-lg sm:text-xl font-display text-white font-normal">
                Exchange, Return &amp; Credit Policy
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-0 sm:pl-11">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-rose-400 font-semibold block mb-1">NO EXCHANGE</span>
                  <p className="text-slate-400 text-xs">
                    Due to biological biosecurity and captive reef system safety, live marine specimens and opened aquatic dry goods cannot be exchanged once dispatched.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-rose-400 font-semibold block mb-1">NO CREDIT</span>
                  <p className="text-slate-400 text-xs">
                    Marine Creatures operates strictly on direct settlement terms. Store credit, ledger credit, or deferred balance adjustments are not provided.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Booking & Advance Money */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                03
              </span>
              <h2 className="text-lg sm:text-xl font-display text-white font-normal">
                Advance Deposits &amp; Booking Money
              </h2>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pl-0 sm:pl-11">
              <p>
                <strong>ADVANCE / BOOKING MONEY IS STRICTLY NON-REFUNDABLE.</strong> When a specimen or custom equipment order is reserved, livestock is held under dedicated quarantine life-support and taken off public reservation.
              </p>
              <p className="text-slate-400 text-xs">
                * Exception: In the rare operational circumstance where Marine Creatures is unable to fulfill a booked specimen due to pre-dispatch quarantine observations or importer stock failure, the deposit will be returned in full or applied to an authorized replacement.
              </p>
            </div>
          </div>

          {/* 4. Client Classification */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                04
              </span>
              <h2 className="text-lg sm:text-xl font-display text-white font-normal">
                Buyer Classification &amp; Trade Welcome
              </h2>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed pl-0 sm:pl-11">
              <p>
                <strong>SELLER AND HOBBYIST WELCOME.</strong> Marine Creatures supplies both individual marine reef hobbyists and commercial aquarium retailers / retail sellers across India.
              </p>
              <p className="text-slate-400 text-xs">
                Wholesale bulk dispatch, consolidated shipping crates, and quarantine batch scheduling are available for commercial partners upon direct coordinator contact.
              </p>
            </div>
          </div>

          {/* Contact Dispatch Box */}
          <div className="p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-[#020b12] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-white">Have specific dispatch coordination questions?</h3>
              <p className="text-xs text-slate-300">
                Contact our dispatch concierge directly on WhatsApp for flight tracking and booking confirmation.
              </p>
            </div>
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                'Hello Marine Creatures! I have a question regarding shipping methods and transit policies.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 shadow-lg"
            >
              Contact Dispatch Concierge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
