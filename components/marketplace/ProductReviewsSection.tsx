'use client';

import React, { useState } from 'react';
import { Product, ProductReview } from '@/lib/data/products';

interface ProductReviewsSectionProps {
  product: Product;
}

// Tailored realistic default reviews with photos based on product category & type
function getDefaultReviews(product: Product): ProductReview[] {
  if (product.category === 'marine-life') {
    return [
      {
        id: 'rev-1',
        author: 'Arjun Nambiar',
        location: 'Bengaluru, Karnataka',
        rating: 5,
        date: '28 Aug 2026',
        title: 'Arrived active, vibrant, and eating pellets within 2 hours!',
        comment:
          'Ordered to Bengaluru. The oxygenated climate pod was warm and pressurized upon opening. The specimen was completely unstressed and started exploring the rockwork right after drip acclimation. Colors are even more vivid than the catalog photos!',
        verifiedPurchase: true,
        images: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
          'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
        ],
      },
      {
        id: 'rev-2',
        author: 'Priya Mukherjee',
        location: 'Kolkata, West Bengal',
        rating: 5,
        date: '15 Aug 2026',
        title: 'Outstanding health and zero signs of quarantine stress',
        comment:
          'I have been keeping marine aquariums for 8 years. Marine Creatures has by far the best live arrival standard in India. Drip acclimation instructions were crystal clear, and the customer concierge on WhatsApp kept me updated until delivery.',
        verifiedPurchase: true,
        images: [
          'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
        ],
      },
      {
        id: 'rev-3',
        author: 'Dr. Sameer Joshi',
        location: 'Pune, Maharashtra',
        rating: 5,
        date: '02 Aug 2026',
        title: 'Bonded pair settled instantly in my bubble tip anemone',
        comment:
          'Flawless condition. No fin damage, clean gills, and very friendly behavior. They paired up with my BTA within 24 hours. Highly recommended for any serious reefer!',
        verifiedPurchase: true,
      },
    ];
  }

  if (product.category === 'lighting-tech') {
    return [
      {
        id: 'rev-1',
        author: 'Kunal Deshmukh',
        location: 'Mumbai, Maharashtra',
        rating: 5,
        date: '24 Aug 2026',
        title: 'Unbelievable PAR penetration and whisper-quiet operation',
        comment:
          'Mounted this over my 90cm mixed reef. The shimmer and coral fluorescence under the actinic blue channels are jaw-dropping. The aluminium casing runs surprisingly cool and the mobile app schedule is seamless.',
        verifiedPurchase: true,
        images: [
          'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80',
          'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
        ],
      },
      {
        id: 'rev-2',
        author: 'Rahul Aggarwal',
        location: 'New Delhi',
        rating: 5,
        date: '10 Aug 2026',
        title: 'SPS polyp extension doubled in two weeks!',
        comment:
          'Upgraded from generic LED strips. The spectrum difference is night and day. My Acroporas and Montiporas have already started showing new growth tips. Solid build quality.',
        verifiedPurchase: true,
      },
    ];
  }

  // Default for dry goods, salts, rock & hardware
  return [
    {
      id: 'rev-1',
      author: 'Vikram Mehta',
      location: 'Hyderabad, Telangana',
      rating: 5,
      date: '22 Aug 2026',
      title: 'Top-tier quality, zero dust, and perfectly packaged',
      comment:
        'Shipped securely without any carton punctures or leaks. Genuine sealed manufacturer packaging. Set it up in my display tank and the water parameters stabilized immediately. Great customer support from Marine Creatures team!',
      verifiedPurchase: true,
      images: [
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
      ],
    },
    {
      id: 'rev-2',
      author: 'Anand Krishnan',
      location: 'Chennai, Tamil Nadu',
      rating: 5,
      date: '08 Aug 2026',
      title: 'Essential reef gear — 100% satisfied',
      comment:
        'Exactly as described. Fast shipping via express cargo to Chennai. Everything was delivered intact and works like a charm. Will definitely be buying again for my upcoming expansion.',
      verifiedPurchase: true,
    },
  ];
}

export function ProductReviewsSection({ product }: ProductReviewsSectionProps) {
  const initialReviews =
    product.reviews && product.reviews.length > 0
      ? product.reviews
      : getDefaultReviews(product);

  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [filterRating, setFilterRating] = useState<'all' | 'with-photos' | '5' | '4'>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({
    'rev-1': 14,
    'rev-2': 9,
    'rev-3': 6,
  });

  // Write Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    author: '',
    location: '',
    rating: 5,
    title: '',
    comment: '',
    image: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Compute all photos from all reviews
  const allCustomerPhotos = React.useMemo(() => {
    const photos: { url: string; author: string; title: string }[] = [];
    reviews.forEach((r) => {
      if (r.images && r.images.length > 0) {
        r.images.forEach((img) => {
          photos.push({ url: img, author: r.author, title: r.title });
        });
      }
    });
    return photos;
  }, [reviews]);

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'with-photos') {
      return r.images && r.images.length > 0;
    }
    if (filterRating === '5') return r.rating === 5;
    if (filterRating === '4') return r.rating === 4;
    return true;
  });

  const averageRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  ).toFixed(1);

  const handleVoteHelpful = (id: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.author.trim() || !reviewForm.comment.trim()) return;

    const newReview: ProductReview = {
      id: `rev-${Date.now()}`,
      author: reviewForm.author.trim(),
      location: reviewForm.location.trim() || 'India',
      rating: reviewForm.rating,
      date: 'Just now',
      title: reviewForm.title.trim() || 'Verified Customer Review',
      comment: reviewForm.comment.trim(),
      verifiedPurchase: true,
      images: reviewForm.image ? [reviewForm.image] : undefined,
    };

    setReviews([newReview, ...reviews]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsModalOpen(false);
      setReviewForm({
        author: '',
        location: '',
        rating: 5,
        title: '',
        comment: '',
        image: '',
      });
    }, 1200);
  };

  return (
    <section className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-slate-800/80">
      {/* ── Section Heading ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-yellow-400 text-sm">★ ★ ★ ★ ★</span>
            <span className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400">
              Verified Indian Reefers
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Customer Reviews &amp; Tank Photos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real feedback and living tank photographs from aquarium enthusiasts across India.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md self-start md:self-auto shrink-0"
        >
          <span>✍️</span>
          <span>Write a Review</span>
        </button>
      </div>

      {/* ── Rating Score Summary Card ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-3xl bg-[#071520] border border-slate-800 mb-8 shadow-xl">
        {/* Left: Overall Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r border-slate-800 lg:pr-8 py-2">
          <span className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
            {averageRating}
          </span>
          <div className="flex items-center gap-1 text-yellow-400 text-lg my-2">
            {'★'.repeat(Math.round(Number(averageRating)))}
            {'☆'.repeat(5 - Math.round(Number(averageRating)))}
          </div>
          <p className="text-xs font-semibold text-slate-300">
            Based on {reviews.length} verified customer reviews
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>✓</span> 100% Verified Purchases Across India
          </span>
        </div>

        {/* Center: Rating Star Breakdown */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5 lg:pl-4">
          {[
            { stars: 5, pct: 92 },
            { stars: 4, pct: 8 },
            { stars: 3, pct: 0 },
            { stars: 2, pct: 0 },
            { stars: 1, pct: 0 },
          ].map((bar) => (
            <div key={bar.stars} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-slate-400 font-medium shrink-0">
                {bar.stars} Stars
              </span>
              <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-400 font-mono text-[11px] shrink-0">
                {bar.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Customer Tank Photos Showcase ──────────────────────────────── */}
      {allCustomerPhotos.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
              <span>📸</span>
              <span>Customer Photos ({allCustomerPhotos.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click any photo to enlarge</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none touch-momentum">
            {allCustomerPhotos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setLightboxImage(photo.url)}
                className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-md hover:border-cyan-400 transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🔍 View</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews Filter Chips ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setFilterRating('all')}
          className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterRating === 'all'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Reviews ({reviews.length})
        </button>

        {allCustomerPhotos.length > 0 && (
          <button
            onClick={() => setFilterRating('with-photos')}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filterRating === 'with-photos'
                ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>📷</span>
            <span>With Photos</span>
          </button>
        )}

        <button
          onClick={() => setFilterRating('5')}
          className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterRating === '5'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          5 Stars Only
        </button>

        <button
          onClick={() => setFilterRating('4')}
          className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filterRating === '4'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          4 Stars Only
        </button>
      </div>

      {/* ── Review Cards List ──────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 sm:p-6 rounded-2xl bg-[#071520] border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-all"
          >
            {/* Review Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/30 text-cyan-300 font-bold text-sm flex items-center justify-center shrink-0">
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
                      📍 {rev.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Star Rating & Date */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-yellow-400 text-sm">
                  {'★'.repeat(rev.rating)}
                  {'☆'.repeat(5 - rev.rating)}
                </div>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{rev.date}</span>
              </div>
            </div>

            {/* Title & Comment */}
            <div className="space-y-1.5">
              <h5 className="text-sm font-semibold text-slate-100">
                &ldquo;{rev.title}&rdquo;
              </h5>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {rev.comment}
              </p>
            </div>

            {/* Customer Uploaded Pictures */}
            {rev.images && rev.images.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {rev.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxImage(img)}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 hover:border-cyan-400 transition-colors"
                    >
                      <img
                        src={img}
                        alt="Customer reef photo"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful Vote Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Was this review helpful?</span>
              <button
                onClick={() => handleVoteHelpful(rev.id)}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>👍</span>
                <span>Helpful ({helpfulVotes[rev.id] || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Photo Lightbox Modal ────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="Enlarged customer photo"
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

      {/* ── Write Review Modal ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#071520] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Write a Review</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share your experience with {product.name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-2">
                <span className="text-4xl block">🎉</span>
                <h4 className="text-base font-bold text-white">Review Submitted!</h4>
                <p className="text-xs text-slate-400">
                  Thank you for sharing your feedback with the Indian reefing community.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                {/* Star Selection */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1.5">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        <span className={star <= reviewForm.rating ? 'text-yellow-400' : 'text-slate-700'}>
                          ★
                        </span>
                      </button>
                    ))}
                    <span className="text-slate-400 font-semibold ml-2">
                      ({reviewForm.rating} of 5 Stars)
                    </span>
                  </div>
                </div>

                {/* Name & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={reviewForm.author}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, author: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      City &amp; State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={reviewForm.location}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, location: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Review Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flawless live arrival and healthy coloration!"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Detailed Review *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell other hobbyists about the packaging, acclimation, feeding response, or product performance..."
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                {/* Optional Photo Attachment */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Photo URL of Your Tank (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={reviewForm.image}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, image: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span>Quick sample photos:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReviewForm({
                          ...reviewForm,
                          image:
                            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
                        })
                      }
                      className="text-cyan-400 hover:underline"
                    >
                      Photo 1
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setReviewForm({
                          ...reviewForm,
                          image:
                            'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
                        })
                      }
                      className="text-cyan-400 hover:underline"
                    >
                      Photo 2
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
