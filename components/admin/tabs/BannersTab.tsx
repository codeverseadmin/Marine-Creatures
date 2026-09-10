'use client';

import React, { useState } from 'react';
import { useCatalog } from '@/lib/context/CatalogContext';
import { BannerSlide } from '@/lib/data/banners';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

interface BannersTabProps {
  passcode?: string;
  showToast: (message: string) => void;
}

export default function BannersTab({ passcode, showToast }: BannersTabProps) {
  const { banners, addBanner, updateBanner, deleteBanner } = useCatalog();

  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [bannerForm, setBannerForm] = useState<Partial<BannerSlide>>({
    id: '',
    badge: 'SPECIAL ANNOUNCEMENT',
    badgeColor: '#00B8D9',
    title: '',
    subtitle: '',
    desc: '',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    ctaText: 'EXPLORE NOW →',
    ctaLink: '/marketplace',
    isActive: true,
    priority: 1,
  });

  const handleEditBannerClick = (banner: BannerSlide) => {
    setBannerForm({ ...banner });
    setEditingBannerId(banner.id);
    setIsEditingBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    showToast(`Uploading banner visual "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-admin-passcode': passcode || '',
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Failed to upload banner');
      }

      const data = await res.json();
      setBannerForm((prev) => ({ ...prev, image: data.url }));
      showToast('✓ Banner background image uploaded and linked!');
    } catch (err: any) {
      console.error('Banner upload error:', err);
      alert(`Banner upload failed: ${err.message}`);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) return;

    const id = editingBannerId || bannerForm.id || `banner-${Date.now()}`;
    const newBanner: BannerSlide = {
      id,
      badge: bannerForm.badge || 'PROMOTION',
      badgeColor: bannerForm.badgeColor || '#00B8D9',
      title: bannerForm.title || '',
      subtitle: bannerForm.subtitle || '',
      desc: bannerForm.desc || '',
      image: bannerForm.image || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
      ctaText: bannerForm.ctaText || 'EXPLORE NOW →',
      ctaLink: bannerForm.ctaLink || '/marketplace',
      isActive: bannerForm.isActive ?? true,
      priority: Number(bannerForm.priority) || 1,
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, newBanner);
      showToast(`✓ Banner updated`);
    } else {
      addBanner(newBanner);
      showToast(`✓ New banner slide created`);
    }

    setIsEditingBanner(false);
    setEditingBannerId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Promotional Carousel Slides</h2>
          <p className="text-xs text-slate-400">Manage announcements sliding on customer homepage</p>
        </div>

        {!isEditingBanner && (
          <button
            onClick={() => {
              setBannerForm({
                id: `banner-${Date.now()}`,
                badge: 'SPECIAL ANNOUNCEMENT',
                badgeColor: '#00B8D9',
                title: '',
                subtitle: '',
                desc: '',
                image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
                ctaText: 'EXPLORE NOW →',
                ctaLink: '/marketplace',
                isActive: true,
                priority: banners.length + 1,
              });
              setEditingBannerId(null);
              setIsEditingBanner(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
          >
            <span>+</span>
            <span>Create Slide</span>
          </button>
        )}
      </div>

      {/* Banner Editor */}
      {isEditingBanner && (
        <form
          onSubmit={handleSaveBanner}
          className="bg-[#071520] border-2 border-cyan-400 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">
              {editingBannerId ? 'Edit Announcement Slide' : 'Create New Slide'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingBanner(false)}
              className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Slide Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Red Sea Live Coral Restock"
                value={bannerForm.title || ''}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Subtitle / Tagline *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 50+ New Acropora Frags Ready"
                value={bannerForm.subtitle || ''}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Badge Text
              </label>
              <input
                type="text"
                placeholder="e.g. LIMITED DROP"
                value={bannerForm.badge || ''}
                onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                CTA Button Text
              </label>
              <input
                type="text"
                placeholder="EXPLORE NOW →"
                value={bannerForm.ctaText || ''}
                onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Background Image URL *
                </label>
                <label className={`cursor-pointer text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1 rounded-lg border border-cyan-400/30 transition-all active:scale-95 ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span>📸 Upload Visual</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingMedia}
                    onChange={handleBannerImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <input
                type="text"
                required
                placeholder="https://... or tap 'Upload Visual' above"
                value={bannerForm.image || ''}
                onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <input
                type="checkbox"
                id="bannerActiveCheck"
                checked={bannerForm.isActive}
                onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                className="w-6 h-6 rounded text-cyan-400 bg-slate-800 border-slate-700"
              />
              <label htmlFor="bannerActiveCheck" className="text-sm text-white font-semibold cursor-pointer">
                Broadcast Live on Customer Homepage Carousel
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingBanner(false)}
              className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
            >
              Save Slide →
            </button>
          </div>
        </form>
      )}

      {/* Banner Cards (Responsive 2-col on Laptop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-[#071520] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-4 overflow-hidden"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400">
                  {b.badge}
                </span>
                <button
                  onClick={() => {
                    updateBanner(b.id, { isActive: !b.isActive });
                    showToast(b.isActive ? 'Slide hidden' : 'Slide active');
                  }}
                  className={`text-xs px-3 py-1 rounded-full font-bold border ${
                    b.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {b.isActive ? '● Live' : '○ Hidden'}
                </button>
              </div>

              <div className="h-32 sm:h-36 rounded-2xl overflow-hidden relative border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <h4 className="absolute bottom-3 left-4 right-4 text-base sm:text-lg font-bold text-white truncate">
                  {b.title}
                </h4>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium truncate">{b.subtitle}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                CTA: <strong className="text-white">{b.ctaText}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditBannerClick(b)}
                  className="h-10 px-4 rounded-xl bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 text-xs font-bold border border-cyan-400/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete banner "${b.title}"?`)) {
                      deleteBanner(b.id);
                      showToast('Banner slide deleted');
                    }
                  }}
                  className="h-10 w-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 flex items-center justify-center"
                  title="Delete banner"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Carousel Preview Card */}
      <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Storefront Carousel Preview
        </h3>
        <PromoCarousel />
      </div>
    </div>
  );
}
