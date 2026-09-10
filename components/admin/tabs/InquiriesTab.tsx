'use client';

import React from 'react';
import { useCatalog } from '@/lib/context/CatalogContext';

interface InquiriesTabProps {
  showToast: (message: string) => void;
}

export default function InquiriesTab({ showToast }: InquiriesTabProps) {
  const { inquiries, deleteInquiry } = useCatalog();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Customer Consultation Leads</h2>
          <p className="text-xs text-slate-400">
            Leads submitted from online forms with 1-tap WhatsApp reply
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="p-12 text-center bg-[#071520] rounded-3xl border border-slate-800">
          <span className="text-4xl block mb-2">📬</span>
          <p className="text-base text-slate-300 font-semibold">No pending leads right now</p>
          <p className="text-xs text-slate-500 mt-1">
            Incoming callback and custom aquarium inquiries appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  {inq.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-white">{inq.name}</h4>
                <p className="text-sm text-cyan-300 font-semibold mt-0.5">{inq.phone}</p>
                {inq.email && <p className="text-xs text-slate-400 mt-0.5">{inq.email}</p>}
              </div>

              {inq.serviceType && (
                <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  Requested: <strong className="text-white">{inq.serviceType}</strong>
                  {inq.spaceType && <span> ({inq.spaceType})</span>}
                </div>
              )}

              {inq.notes && (
                <p className="text-xs text-slate-300 italic bg-black/40 p-3 rounded-xl border border-slate-800">
                  &ldquo;{inq.notes}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <a
                  href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(
                    inq.name
                  )},%20this%20is%20Marine%20Creatures%20following%20up%20on%20your%20consultation%20request.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <span>💬</span>
                  <span>Reply on WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    deleteInquiry(inq.id);
                    showToast('Lead dismissed');
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
