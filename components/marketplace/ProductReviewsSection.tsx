'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductReview } from '@/lib/data/products';

interface ProductReviewsSectionProps {
  product: Product;
}

export function ProductReviewsSection({ product }: ProductReviewsSectionProps) {
  const [dynamicReviews, setDynamicReviews] = useState<ProductReview[] | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchApprovedReviews() {
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.reviews)) {
          const mapped: ProductReview[] = data.reviews.map((r: any) => ({
            id: r.id,
            author: r.customerDisplayName || 'Verified Buyer',
            rating: r.rating,
            date: new Date(r.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            title: r.title,
            comment: r.comment,
            verifiedPurchase: r.verifiedPurchase === true,
            location: r.customerLocation || undefined,
            images: (r.images || []).map((img: any) => (typeof img === 'string' ? img : img.url)),
          }));
          setDynamicReviews(mapped);
        }
      } catch {
        // Fallback gracefully
      }
    }

    fetchApprovedReviews();
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const reviews: ProductReview[] =
    dynamicReviews !== null ? dynamicReviews : product.reviews || [];

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section id="customer-reviews" className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-slate-800/80">
      {/* ── Section Heading ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400">
              Verified Client Experiences
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Customer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Authentic feedback, water parameter stability, and living aquarium photography from verified Marine Creatures clients.
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        /* ── Honest Empty State ───────────────────────────────────────── */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#071520]/70 border border-slate-800/80 text-center relative overflow-hidden shadow-xl">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-md mx-auto space-y-4">
            {/* Minimalist Marine Story Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <svg
                className="w-7 h-7 text-cyan-400/90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                No reviews yet.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 font-light italic leading-relaxed">
                &ldquo;Every aquarium has a story. Be the first to share your experience with this product.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/60 text-[11px] sm:text-xs text-slate-400">
              <span>
                Verified purchasers receive a private review invitation through their order concierge upon confirmed delivery.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Genuine Reviews Display (When approved reviews exist) ─── */
        <div className="space-y-6">
          {/* Genuine Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#071520] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                {averageRating}
              </span>
              <div>
                <div className="flex text-yellow-400 text-base">
                  {'★'.repeat(Math.round(Number(averageRating)))}
                  {'☆'.repeat(5 - Math.round(Number(averageRating)))}
                </div>
                <span className="text-xs text-slate-400">
                  Based on {reviews.length} verified {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          </div>

          {/* Genuine Review Cards */}
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#071520] border border-slate-800 space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-bold text-sm flex items-center justify-center shrink-0">
                      {rev.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{rev.author}</h4>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>✓</span>
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      {rev.location && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {rev.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex text-yellow-400 text-sm">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{rev.date}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h5 className="text-sm font-semibold text-slate-100">
                    &ldquo;{rev.title}&rdquo;
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none pt-2">
                    {rev.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxImage(img)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 hover:border-cyan-400 transition-colors"
                      >
                        <img
                          src={img}
                          alt="Customer aquarium photograph"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Photo Lightbox Modal ────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in overscroll-none"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Enlarged client photograph"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm border border-white/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
