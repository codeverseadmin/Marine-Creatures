'use client';

import React, { useState } from 'react';
import { Product, ProductMedia } from '@/lib/data/products';
import { optimizeImageForUpload } from '@/lib/image-optimizer';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProductId: string | null;
  productForm: Partial<Product>;
  setProductForm: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  passcode: string;
  showToast: (msg: string) => void;
}

export function ProductFormModal({
  isOpen,
  editingProductId,
  productForm,
  setProductForm,
  onClose,
  onSave,
  passcode,
  showToast,
}: ProductFormModalProps) {
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  if (!isOpen) return null;

  const activePasscode =
    passcode?.trim() ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('mc_admin_passcode')?.trim() : '') ||
    'mc@admin#2026!';

  // Media Manager Handlers (Binary Cloud & MongoDB Upload Pipeline)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    showToast(`Optimizing & uploading ${files.length} photo(s)...`);

    try {
      const uploadedMediaItems: ProductMedia[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileToUpload = await optimizeImageForUpload(file, 1600, 0.85);

        if (fileToUpload.size > 4.5 * 1024 * 1024) {
          alert(`"${file.name}" is too large for upload (>4.5MB). Please select a smaller photo.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', 'image');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'x-admin-passcode': activePasscode,
          },
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          let errorMsg = `Upload failed for ${file.name}`;
          try {
            const err = await res.json();
            errorMsg = err.error || errorMsg;
          } catch {
            const text = await res.text().catch(() => '');
            if (res.status === 413 || text.includes('PAYLOAD_TOO_LARGE')) {
              errorMsg = `"${file.name}" exceeds server payload limit (max 4.5MB).`;
            } else if (res.status === 401) {
              errorMsg = 'Admin authentication required. Please re-enter your passcode.';
            }
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        uploadedMediaItems.push({
          id: data.mediaId || `media-${Date.now()}-${i}`,
          type: 'image',
          url: data.url,
          title: file.name,
        });
      }

      setProductForm((prev) => {
        const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
        const updatedMedia = [...currentMedia, ...uploadedMediaItems];
        const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
        return {
          ...prev,
          media: updatedMedia,
          images: updatedImages.length > 0 ? updatedImages : prev.images,
        };
      });

      showToast(`✓ Uploaded ${uploadedMediaItems.length} photo(s) successfully!`);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 4.5 * 1024 * 1024) {
      alert('Direct video upload is limited to 4.5MB. For larger videos, paste an MP4 or YouTube URL into the media list.');
      return;
    }

    setUploadingMedia(true);
    showToast(`Uploading specimen video "${file.name}"...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-admin-passcode': activePasscode,
        },
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `Video upload failed for ${file.name}`;
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          const text = await res.text().catch(() => '');
          if (res.status === 413 || text.includes('PAYLOAD_TOO_LARGE')) {
            errorMsg = 'Video exceeds 4.5MB limit. Please compress or link directly.';
          } else if (res.status === 401) {
            errorMsg = 'Admin authentication required. Please re-enter your passcode.';
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const newMediaItem: ProductMedia = {
        id: data.mediaId || `media-vid-${Date.now()}`,
        type: 'video',
        url: data.url,
        title: file.name,
      };

      setProductForm((prev) => {
        const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
        const updatedMedia = [...currentMedia, newMediaItem];
        const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
        return {
          ...prev,
          media: updatedMedia,
          videos: updatedVideos,
        };
      });

      showToast(`✓ Specimen video "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      console.error('Video upload error:', err);
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    const item: ProductMedia = {
      id: `media-${Date.now()}`,
      type: newMediaType,
      url: newMediaUrl.trim(),
      title: newMediaType === 'video' ? 'Product Video' : 'Product Photo',
    };
    setProductForm((prev) => {
      const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
      const updatedMedia = [...currentMedia, item];
      const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: updatedMedia,
        images: updatedImages.length > 0 ? updatedImages : prev.images,
        videos: updatedVideos,
      };
    });
    setNewMediaUrl('');
    showToast(`✓ Added ${newMediaType} to media strip`);
  };

  const handleRemoveMedia = (index: number) => {
    setProductForm((prev) => {
      const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
      const updatedMedia = currentMedia.filter((_, i) => i !== index);
      const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: updatedMedia,
        images: updatedImages.length > 0 ? updatedImages : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
        videos: updatedVideos,
      };
    });
    showToast('Removed media slide');
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    setProductForm((prev) => {
      const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentMedia.length) return prev;
      const temp = currentMedia[index];
      currentMedia[index] = currentMedia[targetIndex];
      currentMedia[targetIndex] = temp;
      const updatedImages = currentMedia.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = currentMedia.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: currentMedia,
        images: updatedImages.length > 0 ? updatedImages : prev.images,
        videos: updatedVideos,
      };
    });
  };

  const handleSetMediaCover = (index: number) => {
    setProductForm((prev) => {
      const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
      if (index === 0 || index >= currentMedia.length) return prev;
      const [item] = currentMedia.splice(index, 1);
      currentMedia.unshift(item);
      const updatedImages = currentMedia.filter((m) => m.type === 'image').map((m) => m.url);
      return {
        ...prev,
        media: currentMedia,
        images: updatedImages.length > 0 ? updatedImages : prev.images,
      };
    });
    showToast('★ Set as main catalog cover');
  };

  return (
    <div className="bg-[#071520] border-2 border-cyan-400 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-bold text-base sm:text-lg text-white">
            {editingProductId ? `Edit: ${productForm.name}` : 'Create New Product'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Picasso Clownfish (Bonded Pair)"
              value={productForm.name || ''}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Category *
            </label>
            <select
              value={productForm.category || 'marine-life'}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
              className="w-full h-12 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="marine-life">Marine Life (Fish &amp; Corals)</option>
              <option value="lighting-tech">Lighting &amp; Tech</option>
              <option value="rock-sand">Live Rock &amp; Sand</option>
              <option value="salt-chemistry">Salts &amp; Chemistry</option>
              <option value="hardware">Equipment &amp; Skimmers</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Scientific Name / Subtitle
            </label>
            <input
              type="text"
              placeholder="e.g. Amphiprion percula"
              value={productForm.scientificName || ''}
              onChange={(e) => setProductForm({ ...productForm, scientificName: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Price (₹) *
            </label>
            <input
              type="number"
              required
              placeholder="14999"
              value={productForm.price || ''}
              onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-bold text-cyan-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Original Price / MRP (₹)
            </label>
            <input
              type="number"
              placeholder="17999"
              value={productForm.originalPrice || ''}
              onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Current Stock Units *
            </label>
            <input
              type="number"
              required
              placeholder="10"
              value={productForm.stockCount ?? 0}
              onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Highlight Badge
            </label>
            <input
              type="text"
              placeholder="e.g. Rare Pair, Best Seller"
              value={productForm.badge || ''}
              onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <input
              type="checkbox"
              id="inStockCheck"
              checked={productForm.inStock}
              onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
              className="w-6 h-6 rounded text-cyan-400 bg-slate-800 border-slate-700"
            />
            <label htmlFor="inStockCheck" className="text-sm text-white font-semibold cursor-pointer">
              Mark as Available for Customer Checkout
            </label>
          </div>

          {/* Media Gallery Manager (Photos & Videos Slideshow) */}
          <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>📸 Product Media Slideshow (Photos &amp; Videos)</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-normal">
                    ({productForm.media?.length || 0} items)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload photos and live quarantine specimen video clips. Slide #1 will be the main catalog cover.
                </p>
              </div>

              {/* Direct Action Upload Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {uploadingMedia && (
                  <div className="h-9 px-3.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Uploading to Cloud Vault...</span>
                  </div>
                )}

                {/* Photo File Picker */}
                <label className={`cursor-pointer h-9 px-3.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-400/30 active:scale-95 transition-all ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span>📸</span>
                  <span>Upload Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingMedia}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Video File Picker */}
                <label className={`cursor-pointer h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 transition-all ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span>🎥</span>
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    disabled={uploadingMedia}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Add by URL input bar */}
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <select
                value={newMediaType}
                onChange={(e) => setNewMediaType(e.target.value as any)}
                className="h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 shrink-0 font-medium"
              >
                <option value="image">📸 Photo URL</option>
                <option value="video">🎥 Video URL (MP4/WebM)</option>
              </select>
              <input
                type="text"
                placeholder={newMediaType === 'video' ? 'Paste direct video URL (e.g. https://.../video.mp4)' : 'Paste image URL (e.g. https://.../photo.jpg)'}
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="flex-1 h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddMediaUrl}
                className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 active:scale-95"
              >
                + Add to Slideshow
              </button>
            </div>

            {/* Visual Slideshow Strip Grid */}
            {productForm.media && productForm.media.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                {productForm.media.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`relative rounded-2xl border overflow-hidden bg-slate-900 flex flex-col group ${
                      idx === 0 ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,184,217,0.3)]' : 'border-slate-800'
                    }`}
                  >
                    {/* Slide Preview Container */}
                    <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {item.type === 'video' ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <video
                            src={item.url}
                            muted
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs pl-0.5 font-bold shadow-md">
                              ▶
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Slide Number Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white">
                          #{idx + 1}
                        </span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-[9px] font-bold text-slate-950 uppercase tracking-wider">
                            Cover
                          </span>
                        )}
                      </div>

                      {/* Media Type Indicator */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            item.type === 'video'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800/90 text-slate-200'
                          }`}
                        >
                          {item.type === 'video' ? '🎥 Video' : '📸 Photo'}
                        </span>
                      </div>
                    </div>

                    {/* Card Action Controls */}
                    <div className="p-2 bg-slate-950/80 flex items-center justify-between gap-1 border-t border-slate-800/80 text-[11px]">
                      {idx !== 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSetMediaCover(idx)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                          title="Make this the main cover image"
                        >
                          ★ Make Cover
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium italic">
                          Primary Cover
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMedia(idx, 'up')}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                          title="Move earlier"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={idx === (productForm.media?.length || 0) - 1}
                          onClick={() => handleMoveMedia(idx, 'down')}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                          title="Move later"
                        >
                          ▶
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="w-6 h-6 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center text-xs ml-1"
                          title="Remove slide"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 bg-slate-900/40">
                <span className="text-2xl block mb-1">📸</span>
                <p className="text-xs text-slate-400 font-medium">No media uploaded for this product yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Upload at least one photo or video to display in the customer slideshow.</p>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
              Short Description
            </label>
            <textarea
              rows={2}
              placeholder="Origin, compatibility, highlights..."
              value={productForm.shortDesc || ''}
              onChange={(e) => setProductForm({ ...productForm, shortDesc: e.target.value })}
              className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
          >
            {editingProductId ? 'Update Product' : 'Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
