'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReviewsSubtab } from './types';

interface ReviewItem {
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  customerDisplayName: string;
  customerLocation?: string;
  customerPhoneMasked: string;
  rating: number;
  title: string;
  comment: string;
  images: Array<{ id: string; url: string; mimeType?: string; fileSize?: number }>;
  verifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPORTED';
  submittedAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
}

interface InvitationItem {
  tokenHash: string;
  orderId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  reviewId?: string;
  createdBy: string;
  createdAt: string;
  isExpired: boolean;
}

interface DeliveredOrder {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  currentStep: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}

interface ControlOsReviewsProps {
  initialSubtab?: ReviewsSubtab;
  showToast?: (msg: string) => void;
}

export function ControlOsReviews({ initialSubtab = 'pending', showToast }: ControlOsReviewsProps) {
  const [subtab, setSubtab] = useState<ReviewsSubtab>(initialSubtab);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  // Photo Lightbox state
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Rejection modal state
  const [rejectModalReview, setRejectModalReview] = useState<ReviewItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  // Invitations state
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveredOrder | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [generatedInviteResult, setGeneratedInviteResult] = useState<{
    invitationUrl: string;
    productName: string;
    customerName: string;
    customerPhone: string;
    orderId: string;
  } | null>(null);

  const notify = (msg: string) => {
    if (showToast) showToast(msg);
  };

  // Fetch reviews based on active subtab
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam =
        subtab === 'pending'
          ? 'PENDING'
          : subtab === 'approved'
          ? 'APPROVED'
          : subtab === 'rejected'
          ? 'REJECTED'
          : 'all';

      const queryParams = new URLSearchParams({
        status: statusParam,
        limit: '50',
      });
      if (search.trim()) queryParams.set('search', search.trim());

      const res = await fetch(`/api/admin/reviews?${queryParams.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setReviews(data.data || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        notify('⚠️ ' + (data.error || 'Failed to load reviews.'));
      }
    } catch {
      notify('⚠️ Connection error while fetching reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [subtab, search]);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews/invitations?limit=50', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setInvitations(data.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch delivered orders for invitation generation
  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders?step=delivered&limit=30', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.orders) {
        setDeliveredOrders(data.orders);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (subtab === 'invitations') {
      fetchInvitations();
      fetchDeliveredOrders();
    } else {
      fetchReviews();
    }
  }, [subtab, fetchReviews, fetchInvitations, fetchDeliveredOrders]);

  // Handle Moderation Action (Approve / Reject)
  const handleModerate = async (reviewId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setIsSubmittingModeration(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          moderationReason: reason || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify(status === 'APPROVED' ? '✓ Review approved and published to catalogue' : '✓ Review marked as rejected');
        setRejectModalReview(null);
        setRejectReason('');
        await fetchReviews();
      } else {
        notify('⚠️ ' + (data.error || 'Failed to update review status.'));
      }
    } catch {
      notify('⚠️ Error submitting moderation decision.');
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  // Generate Review Invitation
  const handleGenerateInvitation = async () => {
    if (!selectedOrder || !selectedProductId) {
      notify('⚠️ Please select both an order and a product item.');
      return;
    }

    setIsGeneratingInvite(true);
    try {
      const res = await fetch('/api/admin/reviews/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productId: selectedProductId,
          expiryDays: 7,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedInviteResult({
          invitationUrl: data.invitation.invitationUrl,
          productName: data.invitation.productName,
          customerName: data.invitation.customerName,
          customerPhone: data.invitation.customerPhone,
          orderId: data.invitation.orderId,
        });
        notify('✓ Review invitation created successfully');
        await fetchInvitations();
      } else {
        notify('⚠️ ' + (data.error || 'Failed to generate invitation.'));
      }
    } catch {
      notify('⚠️ Error creating invitation link.');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-navigation & Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Customer Reviews &amp; Moderation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Database-backed first-party customer reviews. Strictly authentic feedback from verified delivered clients.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              if (subtab === 'invitations') fetchInvitations();
              else fetchReviews();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Refresh current list"
          >
            <span>⟳</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 overflow-x-auto scrollbar-none pb-2 text-xs">
        <button
          onClick={() => setSubtab('pending')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            subtab === 'pending'
              ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>⏳ Pending Moderation</span>
          {counts.PENDING > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
              {counts.PENDING}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubtab('approved')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            subtab === 'approved'
              ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>✓ Approved &amp; Published</span>
          {counts.APPROVED > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
              {counts.APPROVED}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubtab('rejected')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            subtab === 'rejected'
              ? 'bg-rose-400/15 text-rose-300 border border-rose-400/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>✕ Rejected</span>
          {counts.REJECTED > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
              {counts.REJECTED}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubtab('invitations')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            subtab === 'invitations'
              ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>🔗 Review Invitations (WhatsApp)</span>
        </button>
      </div>

      {/* ── Search & Filter Controls (for reviews) ────────────────────────── */}
      {subtab !== 'invitations' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, customer, or order ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      )}

      {/* ── Review List Content ───────────────────────────────────────────── */}
      {subtab !== 'invitations' ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
              Loading customer reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#07121a]/60 border border-slate-800 text-center space-y-3">
              <span className="text-3xl block">🌊</span>
              <h3 className="text-sm font-bold text-white">No reviews found in this view</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {subtab === 'pending'
                  ? 'All submitted customer reviews have been moderated. New submissions will appear here for review.'
                  : subtab === 'approved'
                  ? 'No approved reviews currently published.'
                  : 'No rejected reviews on record.'}
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#07131e] border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 shadow-lg"
              >
                {/* Header row: Product & Client metadata */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-cyan-300">
                        {rev.productName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        SKU: {rev.productId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-300 flex-wrap">
                      <span className="font-semibold text-white">{rev.customerDisplayName}</span>
                      {rev.customerLocation && (
                        <span className="text-slate-400">({rev.customerLocation})</span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Phone: {rev.customerPhoneMasked}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span>✓</span>
                        <span>Delivered Order #{rev.orderId}</span>
                      </span>
                    </div>
                  </div>

                  {/* Rating & Date */}
                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <div className="flex text-yellow-400 text-sm">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {new Date(rev.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    &ldquo;{rev.title}&rdquo;
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                </div>

                {/* Attached Customer Photos */}
                {rev.images && rev.images.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
                      Attached Aquarium Photography ({rev.images.length}):
                    </span>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {rev.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhoto(img.url)}
                          className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 hover:border-cyan-400 transition-colors group relative"
                        >
                          <img
                            src={img.url}
                            alt="Customer photo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity font-bold">
                            🔍
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderation Rationale & Actions */}
                <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    {rev.status === 'APPROVED' ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                        <span>✓ Published</span>
                        {rev.moderatedBy && (
                          <span className="text-slate-400">by {rev.moderatedBy}</span>
                        )}
                      </span>
                    ) : rev.status === 'REJECTED' ? (
                      <div className="text-rose-400 text-xs">
                        <span className="font-semibold">✕ Rejected</span>
                        {rev.moderatedBy && <span> by {rev.moderatedBy}</span>}
                        {rev.moderationReason && (
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Reason: {rev.moderationReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5 font-medium">
                        <span>⏳ Pending review moderation</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {rev.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleModerate(rev.id, 'APPROVED')}
                        disabled={isSubmittingModeration}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>✓</span>
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}

                    {rev.status !== 'REJECTED' && (
                      <button
                        onClick={() => setRejectModalReview(rev)}
                        disabled={isSubmittingModeration}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span>✕</span>
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Review Invitations Workflow ──────────────────────────────────── */
        <div className="space-y-8">
          {/* Section A: Generate Invitation Card */}
          <div className="p-6 rounded-2xl bg-[#07131e] border border-cyan-500/20 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔗</span>
                <span>Generate Single-Use Review Invitation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Invitations are cryptographically bounded to verified delivered orders. When opened, the customer can submit an authentic review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: Select Delivered Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. Select Delivered Order:
                </label>
                <select
                  value={selectedOrder?.id || ''}
                  onChange={(e) => {
                    const ord = deliveredOrders.find((o) => o.id === e.target.value) || null;
                    setSelectedOrder(ord);
                    setSelectedProductId('');
                    setGeneratedInviteResult(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">-- Choose delivered order --</option>
                  {deliveredOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.id} — {ord.customerName} ({ord.city}) [{ord.items?.length || 0} items]
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Purchased Product in this Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  2. Select Item for Review:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setGeneratedInviteResult(null);
                  }}
                  disabled={!selectedOrder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-40"
                >
                  <option value="">-- Select purchased SKU --</option>
                  {selectedOrder?.items?.map((item) => {
                    const baseId = item.id.split('__')[0];
                    return (
                      <option key={item.id} value={baseId}>
                        {item.name} (₹{item.price.toLocaleString('en-IN')})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerateInvitation}
                disabled={!selectedOrder || !selectedProductId || isGeneratingInvite}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md disabled:opacity-40 flex items-center gap-2"
              >
                {isGeneratingInvite ? (
                  <span>Generating Token...</span>
                ) : (
                  <>
                    <span>Generate Review Link</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Result Card */}
            {generatedInviteResult && (
              <div className="mt-4 p-5 rounded-xl bg-cyan-950/40 border border-cyan-400/40 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <span>✓</span>
                    <span>Invitation Ready for Dispatch</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                    Expires in 7 days
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">Client:</strong> {generatedInviteResult.customerName} ({generatedInviteResult.customerPhone})
                  </p>
                  <p>
                    <strong className="text-white">Product:</strong> {generatedInviteResult.productName} (Order #{generatedInviteResult.orderId})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteResult.invitationUrl}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteResult.invitationUrl);
                      notify('✓ Invitation link copied to clipboard');
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition-colors whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                  <a
                    href={`https://wa.me/${generatedInviteResult.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi ${generatedInviteResult.customerName}! Thank you for choosing Marine Creatures for your aquarium journey. As your order #${generatedInviteResult.orderId} has been safely delivered, we would love to hear your authentic experience and see photos of your ${generatedInviteResult.productName}.\n\nPlease share your review here:\n${generatedInviteResult.invitationUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>💬</span>
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Active & Historical Review Invitations Table */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">
              Invitation Audit Registry ({invitations.length})
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#07131e]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Order</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Expires</th>
                    <th className="p-3.5">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                        No review invitations generated yet.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-mono text-cyan-300">
                          #{inv.orderId}
                        </td>
                        <td className="p-3.5 font-medium text-white max-w-xs truncate">
                          {inv.productName}
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-slate-200 block">{inv.customerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{inv.customerPhone}</span>
                        </td>
                        <td className="p-3.5">
                          {inv.isUsed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <span>✓</span>
                              <span>Completed</span>
                            </span>
                          ) : inv.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                              <span>✕</span>
                              <span>Expired</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <span>⏳</span>
                              <span>Active Unused</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(inv.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-400">
                          {inv.createdBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox Modal ──────────────────────────────────────────── */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto}
              alt="Client photograph full view"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm border border-white/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal ────────────────────────────────────────── */}
      {rejectModalReview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0b141d] border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-rose-400">✕</span>
              <span>Reject Customer Review</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide an administrative rationale for rejecting this review. This reason is permanently recorded in the immutable audit log.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Inappropriate language, unrelated advertisement, duplicate content..."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalReview(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModerate(rejectModalReview.id, 'REJECTED', rejectReason)}
                disabled={isSubmittingModeration}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

