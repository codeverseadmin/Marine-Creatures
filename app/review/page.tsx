'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface InvitationData {
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  customerDisplayName: string;
  customerLocation?: string;
  expiresAt: string;
}

interface UploadedImage {
  id: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

function ReviewSubmissionForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Image upload in-progress
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const ratingLabels: Record<number, string> = {
    1: 'Poor / Struggled',
    2: 'Fair / Needed Monitoring',
    3: 'Good / Healthy Specimen',
    4: 'Very Good / High Vitality',
    5: 'Exceptional / Thriving Quality',
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('A valid review invitation token is required. Review links are sent via concierge upon confirmed delivery.');
      return;
    }

    async function verifyToken() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reviews/invitation/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.success && data.invitation) {
          setInvitation(data.invitation);
          setDisplayName(data.invitation.customerDisplayName || '');
          setLocation(data.invitation.customerLocation || '');
        } else {
          setError(data.error || 'This review invitation is invalid or has expired.');
        }
      } catch {
        setError('Unable to verify review invitation due to a network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setUploadError('Maximum of 5 photographs allowed per review.');
      return;
    }

    setUploadError(null);
    setIsUploadingPhoto(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);

      try {
        const res = await fetch('/api/reviews/upload-image', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.image) {
          setUploadedImages((prev) => [...prev, data.image]);
        } else {
          setUploadError(data.error || `Failed to upload "${file.name}".`);
        }
      } catch {
        setUploadError(`Network error while uploading "${file.name}".`);
      }
    }

    setIsUploadingPhoto(false);
    // Reset file input
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!title.trim() || title.trim().length < 3) {
      alert('Please enter a descriptive review headline (at least 3 characters).');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      alert('Please share more details about your experience (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          customerDisplayName: displayName.trim(),
          customerLocation: location.trim(),
          images: uploadedImages,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSubmitted(true);
      } else {
        alert(data.error || 'Failed to submit review. Please check your inputs and try again.');
      }
    } catch {
      alert('A network error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b11] text-slate-100 flex items-center justify-center p-4 font-mono text-xs">
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#091522] border border-cyan-500/20 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Verifying concierge review invitation...</span>
        </div>
      </div>
    );
  }

  // 2. Error / Expired State
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#050b11] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#091522] border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 text-xl">
            🌊
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Review Invitation Notice
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Explore Catalogue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Success State
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#050b11] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-[#091522] border border-cyan-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400 block font-mono">
              Submission Received
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Thank You for Sharing Your Story
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your authentic feedback for <strong className="text-white">{invitation.productName}</strong> has been submitted.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
            <p className="font-semibold text-slate-300">Concierge Verification Protocol:</p>
            <p>
              To maintain our zero-fabrication standard and ensure high-resolution photo presentation, submissions are verified by our husbandry team before appearing live in the catalogue.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center transition-colors"
            >
              Return Home
            </Link>
            <Link
              href="/marketplace"
              className="flex-1 h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors shadow-md"
            >
              Explore Catalogue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active Submission Form
  const activeRatingValue = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="min-h-screen bg-[#050b11] text-slate-100 py-12 px-4 sm:px-6 selection:bg-cyan-400 selection:text-black">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-cyan-400 font-mono">
              MARINE CREATURES
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Client Aquarium Experience
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Share your authentic experience with fellow aquarists. Your feedback informs our husbandry care and sourcing.
          </p>
        </div>

        {/* Product Snapshot Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#091522] border border-slate-800 flex items-center gap-4 shadow-xl">
          {invitation.productImage ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
              <img
                src={invitation.productImage}
                alt={invitation.productName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 text-2xl shrink-0">
              🐠
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span>✓</span>
                <span>Verified Delivered Purchase</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Order #{invitation.orderId}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate">
              {invitation.productName}
            </h2>
            <p className="text-[11px] text-slate-400">
              Client: <strong className="text-slate-300">{invitation.customerDisplayName}</strong>
            </p>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#091522] border border-slate-800/90 space-y-6 shadow-2xl">
          {/* 1. Star Rating */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block font-mono">
              Overall Rating <span className="text-cyan-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="text-3xl sm:text-4xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <span className={star <= activeRatingValue ? 'text-yellow-400' : 'text-slate-700'}>
                    ★
                  </span>
                </button>
              ))}
              <span className="text-xs text-cyan-300 font-medium ml-3">
                {ratingLabels[activeRatingValue] || ''}
              </span>
            </div>
          </div>

          {/* 2. Review Headline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">
                Review Headline <span className="text-cyan-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flawless acclimation, active within hours"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* 3. Detailed Experience */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">
                Detailed Experience &amp; Tank Parameters <span className="text-cyan-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {comment.length}/2000
              </span>
            </div>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your acclimation protocol, water parameters (salinity, temp), feeding behavior, or equipment build quality..."
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 leading-relaxed"
            />
          </div>

          {/* 4. Photo Upload */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Aquarium Photography (Optional, max 5 photos)
            </label>
            <p className="text-[11px] text-slate-400">
              Share real photos of your specimen swimming in your display or your hardware installation. EXIF GPS coordinates are automatically stripped for your privacy.
            </p>

            {/* Uploaded Photos Preview */}
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {uploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group"
                  >
                    <img
                      src={img.url}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-rose-500 text-white flex items-center justify-center text-xs transition-colors"
                      title="Remove photograph"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File Input trigger */}
            {uploadedImages.length < 5 && (
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors">
                  <span>📷</span>
                  <span>{isUploadingPhoto ? 'Uploading Photo...' : 'Add Photograph (JPEG, PNG, WebP)'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingPhoto}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
            )}
          </div>

          {/* 5. Display Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Public Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rajesh K."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-[10px] text-slate-500 block">
                Your last name is automatically initialed for privacy.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                City / Region (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, MH"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* 6. Submit Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="w-full h-12 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Verified Review...</span>
              ) : (
                <>
                  <span>Submit Verified Review</span>
                  <span>→</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-3 font-mono">
              Cryptographically verified against delivered Order #{invitation.orderId}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050b11] text-slate-100 flex items-center justify-center p-4 font-mono text-xs">
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#091522] border border-cyan-500/20 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Loading review portal...</span>
          </div>
        </div>
      }
    >
      <ReviewSubmissionForm />
    </Suspense>
  );
}

