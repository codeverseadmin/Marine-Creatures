'use client';

import React from 'react';
import { ControlOsSection } from './types';

interface ControlOsPlaceholderProps {
  section: ControlOsSection;
  onReturnToOverview: () => void;
}

const SECTION_METADATA: Record<
  Exclude<ControlOsSection, 'overview'>,
  {
    title: string;
    code: string;
    phase: string;
    icon: string;
    description: string;
    plannedCapabilities: string[];
  }
> = {
  catalog: {
    title: 'Catalog Governance & Ingestion CMS',
    code: 'CATALOG_OS',
    phase: 'Phase 3B',
    icon: '🐠',
    description:
      'Authoritative product catalog management, bulk ingestion pipelines, variant matrix control, inventory allocation, and automated technical SEO schema generation.',
    plannedCapabilities: [
      'Comprehensive SKU & Variant Matrix Control (Lighting wattage, mounting kits, coral sizing)',
      'Live Stock Status & Specimen Availability Toggling',
      'Batch Image CDN Upload with Metadata Preservation',
      'Direct SEO Slug & Structured Schema Verification per Item',
    ],
  },
  worlds: {
    title: 'Worlds Portfolio & Living Exhibits CMS',
    code: 'WORLDS_OS',
    phase: 'Phase 3C',
    icon: '🏛️',
    description:
      'Living exhibit management, architectural case studies, custom biotope showcases, and luxury gallery publishing for ultra-high-net-worth aquarium commissions.',
    plannedCapabilities: [
      'Case Study Editorial Builder with Multi-View Gallery Assets',
      'Biotope Taxonomy Classification (Red Sea, Great Barrier, Palau Deep Reef)',
      'Aquarium Dimension & Technical Specification Dossiers',
      'High-Resolution Before/After Renovation Transformations',
    ],
  },
  operations: {
    title: 'Operations & Specimen Quarantine Engine',
    code: 'OPERATIONS_OS',
    phase: 'Phase 3D',
    icon: '📦',
    description:
      'Live maritime dispatch management, captive quarantine protocol tracking, air cargo AWB integration, thermal packaging compliance, and customer delivery updates.',
    plannedCapabilities: [
      '5-Stage Live Dispatch Pipeline (Placed → Quarantine → Packed → Dispatched → Delivered)',
      'Specimen Acclimatization & Quarantine Health Logging',
      'Air Cargo Waybill (AWB) & Logistics Tracking Association',
      'Automated One-Tap WhatsApp Dispatch Notification Generation',
    ],
  },
  crm: {
    title: 'Client Concierge & VIP Inquiries',
    code: 'CRM_OS',
    phase: 'Phase 3D',
    icon: '💬',
    description:
      'Private client relationship management, bespoke aquarium project intake, architectural blueprint inquiries, consultation scheduling, and quotation pipelines.',
    plannedCapabilities: [
      'Unified Lead Ingestion across Storefront & Design Consultations',
      'Client Aquarium Profile Tracking (Gallons, Salinity, Biome, Fauna)',
      'Direct WhatsApp Concierge Direct-Message Handoff',
      'Quotation & Proposal Milestone Management',
    ],
  },
  content: {
    title: 'Editorial Journal & Brand Content Engine',
    code: 'CONTENT_OS',
    phase: 'Phase 3E',
    icon: '🎬',
    description:
      'Announcement banner scheduling, marine husbandry care guides, brand storytelling, reef-keeping technical articles, and promotional campaign scheduling.',
    plannedCapabilities: [
      'Announcement Banner Slides Scheduling with Date-Bounded Activation',
      'Reef Care Knowledgebase & Specimen Compatibility Guides',
      'Rich Markdown / Structured Editorial Publishing',
      'Storefront Notice & Emergency Dispatch Advisory Management',
    ],
  },
  analytics: {
    title: 'Business Intelligence & Commercial Yield',
    code: 'ANALYTICS_OS',
    phase: 'Phase 3F',
    icon: '📈',
    description:
      'Multi-month revenue analytics, average order value trends, high-yield product identification, category velocity analysis, and client acquisition funnel telemetry.',
    plannedCapabilities: [
      'Monthly Gross Volume & Trend Analytics with Authentic Historical Baselines',
      'Category Demand & Specimen Popularity Ranking',
      'Cart Conversion & WhatsApp Inbound Acquisition Funnel',
      'Exportable Financial & Inventory Ledger CSV Reports',
    ],
  },
  system: {
    title: 'Fleet Telemetry, Backups & Security',
    code: 'SYSTEM_OS',
    phase: 'Phase 3F',
    icon: '⚙️',
    description:
      'MongoDB Atlas cluster health telemetry, automated database snapshots, administrative access audit logs, API latency tracking, and emergency maintenance controls.',
    plannedCapabilities: [
      'Real-Time MongoDB Atlas Ping & Connection Pool Monitoring',
      'One-Click Automated Cloud Snapshot & Restore Utilities',
      'Administrative Session Expiration & Audit Event Stream',
      'Maintenance Mode & Storefront Rate Limiting Diagnostics',
    ],
  },
};

export function ControlOsPlaceholder({
  section,
  onReturnToOverview,
}: ControlOsPlaceholderProps) {
  if (section === 'overview') {
    return null;
  }

  const meta = SECTION_METADATA[section];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 animate-fade-in font-sans">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Control OS</span>
          <span>/</span>
          <span className="text-cyan-400 font-mono uppercase">{meta.code}</span>
        </div>

        <button
          onClick={onReturnToOverview}
          className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Return to Overview</span>
        </button>
      </div>

      {/* Main Status Surface */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0b121a] border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-3xl shrink-0">
              {meta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {meta.phase}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Architecture Reserved
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5 tracking-tight">
                {meta.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Coming in next phase
            </span>
          </div>
        </div>

        {/* Phase Roadmap Details */}
        <div className="pt-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Planned Module Capabilities ({meta.phase}):
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meta.plannedCapabilities.map((cap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="text-cyan-400 font-bold shrink-0">▸</span>
                <span>{cap}</span>
              </div>
            ))}
          </div>

          {/* Operational Notice */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 mt-4">
            <span className="text-slate-400 text-sm">ℹ️</span>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">Phase 3A Boundary:</strong> Per the
              Marine Creatures Control OS specification, only the Overview Dashboard is
              activated in this initial milestone. No fake data or placeholder tables are
              rendered. Real operational management for this domain will activate cleanly in {meta.phase}.
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              onClick={onReturnToOverview}
              className="h-10 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>← Return to Active Overview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
