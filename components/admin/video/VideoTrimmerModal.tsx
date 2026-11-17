'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VideoMetadata,
  TrimResult,
  getVideoMetadata,
  generateVideoThumbnails,
  trimVideoFile,
  formatTime,
  formatFileSize,
} from '@/lib/services/video-trimmer';

interface VideoTrimmerModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onConfirmTrimmed: (trimmedFile: File, stats: TrimResult) => void;
  onUploadOriginal: (originalFile: File) => void;
}

export function VideoTrimmerModal({
  isOpen,
  file,
  onClose,
  onConfirmTrimmed,
  onUploadOriginal,
}: VideoTrimmerModalProps) {
  // Phase state: loading -> editing -> processing -> preview -> error
  const [phase, setPhase] = useState<'loading' | 'editing' | 'processing' | 'preview' | 'error'>('loading');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [trimmedVideoSrc, setTrimmedVideoSrc] = useState<string | null>(null);

  // Playback & Trimming bounds
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTrimmedPlaying, setIsTrimmedPlaying] = useState<boolean>(false);

  // Dragging state
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | null>(null);

  // Processing state
  const [progress, setProgress] = useState<number>(0);
  const [trimResult, setTrimResult] = useState<TrimResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const trimmedVideoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSegmentPreviewingRef = useRef<boolean>(false);

  // Clean up object URLs on unmount or reset
  const cleanupUrls = useCallback(() => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    if (trimmedVideoSrc) URL.revokeObjectURL(trimmedVideoSrc);
  }, [videoSrc, trimmedVideoSrc]);

  useEffect(() => {
    return () => cleanupUrls();
  }, [cleanupUrls]);

  // Load video file, metadata, and thumbnail filmstrip
  useEffect(() => {
    if (!isOpen || !file) {
      setPhase('loading');
      setMetadata(null);
      setThumbnails([]);
      setTrimResult(null);
      setErrorMessage(null);
      return;
    }

    const targetFile = file;
    let isMounted = true;
    const loadAbort = new AbortController();

    async function loadVideo() {
      try {
        setPhase('loading');
        setErrorMessage(null);
        setProgress(0);

        // 1. Create object URL for original video preview
        const url = URL.createObjectURL(targetFile);
        if (isMounted) setVideoSrc(url);

        // 2. Fetch authoritative video metadata
        const meta = await getVideoMetadata(targetFile);
        if (!isMounted) return;

        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
        setCurrentTime(0);

        // 3. Generate filmstrip thumbnails
        const thumbs = await generateVideoThumbnails(targetFile, 10, loadAbort.signal);
        if (!isMounted) return;

        setThumbnails(thumbs);
        setPhase('editing');
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Video trimmer initialization error:', err);
        setErrorMessage(err.message || 'Failed to initialize video editor.');
        setPhase('error');
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
      loadAbort.abort();
    };
  }, [isOpen, file]);

  // Video playback timeupdate handler (enforces [startTime, endTime] segment boundaries)
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // If segment preview is active, loop back to start when reaching end
    if (isSegmentPreviewingRef.current && video.currentTime >= endTime) {
      video.currentTime = startTime;
      video.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      if (video.currentTime >= endTime || video.currentTime < startTime) {
        video.currentTime = startTime;
      }
      isSegmentPreviewingRef.current = false;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      isSegmentPreviewingRef.current = false;
    }
  };

  const playSegmentPreview = () => {
    const video = videoRef.current;
    if (!video) return;

    isSegmentPreviewingRef.current = true;
    video.currentTime = startTime;
    video.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const resetTrim = () => {
    if (!metadata) return;
    setStartTime(0);
    setEndTime(metadata.duration);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Convert timeline pixel position to timestamp in seconds
  const getTimeFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track || !metadata) return 0;
      const rect = track.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = relativeX / rect.width;
      return percentage * metadata.duration;
    },
    [metadata]
  );

  // Dragging handlers (desktop mouse + mobile touch)
  const handlePointerDown = (type: 'start' | 'end', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDrag(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Pause video during scrub
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !metadata) return;
    const time = getTimeFromClientX(e.clientX);
    const minGap = 0.5; // Minimum segment duration (0.5s)

    if (activeDrag === 'start') {
      const newStart = Math.max(0, Math.min(time, endTime - minGap));
      setStartTime(newStart);
      if (videoRef.current) {
        videoRef.current.currentTime = newStart;
      }
    } else if (activeDrag === 'end') {
      const newEnd = Math.min(metadata.duration, Math.max(time, startTime + minGap));
      setEndTime(newEnd);
      if (videoRef.current) {
        videoRef.current.currentTime = newEnd;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      setActiveDrag(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // Execute actual trimming
  const handleConfirmTrim = async () => {
    if (!file || !metadata) return;

    try {
      setPhase('processing');
      setProgress(0);
      setErrorMessage(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const result = await trimVideoFile({
        file,
        startTime,
        endTime,
        onProgress: (pct) => setProgress(pct),
        signal: abortController.signal,
      });

      setTrimResult(result);

      // Create preview URL for trimmed output
      const trimmedUrl = URL.createObjectURL(result.trimmedFile);
      setTrimmedVideoSrc(trimmedUrl);
      setPhase('preview');
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        setPhase('editing');
      } else {
        console.error('Video trim processing failed:', err);
        setErrorMessage(err.message || 'Video trimming failed.');
        setPhase('error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPhase('editing');
  };

  if (!isOpen || !file) return null;

  const duration = metadata?.duration || 1;
  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const selectedDuration = Math.max(0, endTime - startTime);
  const currentPercent = (currentTime / duration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#06151C] border border-[#00D4FF]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-[#F4F7F5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#020609]/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">✂️</span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                {phase === 'preview' ? 'Trimmed Specimen Video' : 'Video Trimmer'}
              </h3>
              <p className="text-[11px] text-[#9BAFB3] font-mono truncate">
                {file.name} · {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[#9BAFB3] hover:text-white flex items-center justify-center text-sm transition-colors shrink-0"
            aria-label="Close video editor"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Phase: Loading */}
          {phase === 'loading' && (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block w-10 h-10 border-3 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Analyzing specimen video...</p>
                <p className="text-xs text-[#9BAFB3]">
                  Loading video preview and timeline...
                </p>
              </div>
            </div>
          )}

          {/* Phase: Error */}
          {phase === 'error' && (
            <div className="py-12 px-4 text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl text-rose-400">
                ⚠️
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-sm sm:text-base font-bold text-white">Video Processing Error</h4>
                <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-3 rounded-xl font-mono text-left break-words">
                  {errorMessage || 'Unable to process video on this device.'}
                </p>
                <p className="text-xs text-[#9BAFB3]">
                  Your device cannot trim this particular video format. You may still upload the original video directly into the secure catalog.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPhase('editing')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => onUploadOriginal(file)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-[#69E7EA] text-[#020609] text-xs font-bold transition-all shadow-lg shadow-[#00D4FF]/20"
                >
                  Upload Original Video ({formatFileSize(file.size)})
                </button>
              </div>
            </div>
          )}

          {/* Phase: Editing (WhatsApp-Style Trimmer) */}
          {phase === 'editing' && (
            <div className="space-y-4">
              {/* Large Video Preview */}
              <div className="relative aspect-video max-h-[38vh] w-full rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center group">
                {videoSrc && (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    playsInline
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {/* Big Center Play/Pause Overlay */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors group"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  <div className="w-14 h-14 rounded-full bg-black/60 border border-[#00D4FF]/40 text-white flex items-center justify-center text-xl shadow-lg backdrop-blur-sm group-hover:scale-110 group-hover:bg-[#00D4FF] group-hover:text-black transition-all">
                    {isPlaying ? '⏸' : '▶'}
                  </div>
                </button>

                {/* Video Info Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-mono font-semibold text-[#00D4FF] border border-[#00D4FF]/30">
                    {formatTime(currentTime, true)} / {formatTime(duration)}
                  </span>
                  {metadata?.isPortrait && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] text-slate-300 font-mono">
                      PORTRAIT
                    </span>
                  )}
                </div>
              </div>

              {/* Segment Duration & Stats Pill */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#9BAFB3]">Selected Range:</span>
                  <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    {formatTime(startTime, true)} – {formatTime(endTime, true)}
                  </span>
                  <span className="font-mono font-bold text-[#00D4FF]">
                    ({formatTime(selectedDuration, true)}s)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetTrim}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  ↻ Reset Trim
                </button>
              </div>

              {/* WhatsApp-Style Timeline Track with Filmstrip */}
              <div className="space-y-1.5 pt-1">
                <div
                  ref={trackRef}
                  className="relative h-16 w-full rounded-2xl bg-black border border-slate-800 overflow-hidden select-none cursor-pointer touch-none"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={(e) => {
                    // Click track to jump playhead
                    const time = getTimeFromClientX(e.clientX);
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                    }
                  }}
                >
                  {/* Background Filmstrip Thumbnails */}
                  <div className="absolute inset-0 flex">
                    {thumbnails.length > 0 ? (
                      thumbnails.map((thumb, idx) => (
                        <div
                          key={idx}
                          className="flex-1 h-full bg-cover bg-center border-r border-black/30"
                          style={{ backgroundImage: `url(${thumb})` }}
                        />
                      ))
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        Loading timeline filmstrip...
                      </div>
                    )}
                  </div>

                  {/* Left Unselected Dimmed Mask */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-black/75 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
                    style={{ width: `${startPercent}%` }}
                  />

                  {/* Right Unselected Dimmed Mask */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-black/75 backdrop-blur-[1px] transition-all duration-75 pointer-events-none"
                    style={{ width: `${100 - endPercent}%` }}
                  />

                  {/* Selected Window Outline */}
                  <div
                    className="absolute top-0 bottom-0 border-y-2 border-[#00D4FF] pointer-events-none transition-all duration-75"
                    style={{
                      left: `${startPercent}%`,
                      width: `${endPercent - startPercent}%`,
                    }}
                  />

                  {/* Playhead Scrubber Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none transition-all duration-75"
                    style={{ left: `${currentPercent}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -mt-0.5 shadow-sm" />
                  </div>

                  {/* Left Handle (Start Time) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('start', e)}
                    className="absolute top-0 bottom-0 w-5 -ml-2.5 z-20 cursor-ew-resize flex items-center justify-center touch-none group"
                    style={{ left: `${startPercent}%` }}
                    tabIndex={0}
                    role="slider"
                    aria-label="Trim start handle"
                    aria-valuenow={startTime}
                    aria-valuemin={0}
                    aria-valuemax={endTime}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        setStartTime((prev) => Math.max(0, prev - 0.1));
                      } else if (e.key === 'ArrowRight') {
                        setStartTime((prev) => Math.min(endTime - 0.5, prev + 0.1));
                      }
                    }}
                  >
                    {/* Minimum 44px invisible mobile touch pad */}
                    <div className="absolute inset-y-0 -inset-x-3 pointer-events-auto" />

                    {/* Visible Cyan Handle */}
                    <div className="w-3.5 h-full bg-[#00D4FF] rounded-l-md shadow-lg flex flex-col items-center justify-center gap-1 group-hover:bg-[#69E7EA] transition-colors">
                      <div className="w-0.5 h-4 bg-black/70 rounded-full" />
                      <div className="w-0.5 h-4 bg-black/70 rounded-full" />
                    </div>

                    {/* Start Timestamp Tag */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-[#00D4FF] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#00D4FF]/40 pointer-events-none whitespace-nowrap shadow-md">
                      {formatTime(startTime, true)}
                    </div>
                  </div>

                  {/* Right Handle (End Time) */}
                  <div
                    onPointerDown={(e) => handlePointerDown('end', e)}
                    className="absolute top-0 bottom-0 w-5 -ml-2.5 z-20 cursor-ew-resize flex items-center justify-center touch-none group"
                    style={{ left: `${endPercent}%` }}
                    tabIndex={0}
                    role="slider"
                    aria-label="Trim end handle"
                    aria-valuenow={endTime}
                    aria-valuemin={startTime}
                    aria-valuemax={duration}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        setEndTime((prev) => Math.max(startTime + 0.5, prev - 0.1));
                      } else if (e.key === 'ArrowRight') {
                        setEndTime((prev) => Math.min(duration, prev + 0.1));
                      }
                    }}
                  >
                    {/* Minimum 44px invisible mobile touch pad */}
                    <div className="absolute inset-y-0 -inset-x-3 pointer-events-auto" />

                    {/* Visible Cyan Handle */}
                    <div className="w-3.5 h-full bg-[#00D4FF] rounded-r-md shadow-lg flex flex-col items-center justify-center gap-1 group-hover:bg-[#69E7EA] transition-colors">
                      <div className="w-0.5 h-4 bg-black/70 rounded-full" />
                      <div className="w-0.5 h-4 bg-black/70 rounded-full" />
                    </div>

                    {/* End Timestamp Tag */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 text-[#00D4FF] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#00D4FF]/40 pointer-events-none whitespace-nowrap shadow-md">
                      {formatTime(endTime, true)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                  <span>00:00</span>
                  <span className="text-slate-500">Select the portion of the video you want to keep.</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Phase: Processing */}
          {phase === 'processing' && (
            <div className="py-16 text-center space-y-6">
              <div className="inline-block relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-[#00D4FF] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white">
                  {progress}%
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Generating Trimmed Specimen Video...
                </h4>
                <p className="text-xs text-[#9BAFB3]">
                  Trimming selected portion from {formatTime(startTime)} to {formatTime(endTime)}...
                </p>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mt-3">
                  <div
                    className="bg-gradient-to-r from-[#00D4FF] to-[#69E7EA] h-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleCancelProcessing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  ✕ Cancel Trimming
                </button>
              </div>
            </div>
          )}

          {/* Phase: Preview (Step D — Final Preview & Verification) */}
          {phase === 'preview' && trimResult && (
            <div className="space-y-4">
              {/* Trimmed Video Player */}
              <div className="relative aspect-video max-h-[38vh] w-full rounded-2xl bg-black overflow-hidden border border-emerald-500/40 shadow-inner flex items-center justify-center">
                {trimmedVideoSrc && (
                  <video
                    ref={trimmedVideoRef}
                    src={trimmedVideoSrc}
                    controls
                    playsInline
                    className="max-h-full max-w-full object-contain"
                    onPlay={() => setIsTrimmedPlaying(true)}
                    onPause={() => setIsTrimmedPlaying(false)}
                  />
                )}
              </div>

              {/* Comparison Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#020609] border border-slate-800 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#9BAFB3] block uppercase tracking-wider">
                    Original Video
                  </span>
                  <span className="font-mono text-slate-300 font-semibold block">
                    {formatTime(trimResult.originalDuration)} · {formatFileSize(trimResult.originalSize)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-400 block uppercase tracking-wider">
                    Trimmed Segment
                  </span>
                  <span className="font-mono text-emerald-300 font-bold block">
                    {formatTime(trimResult.trimmedDuration)} · {formatFileSize(trimResult.trimmedSize)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-0.5">
                  <span className="text-[10px] text-[#00D4FF] block uppercase tracking-wider">
                    Storage Saved
                  </span>
                  <span className="font-mono text-[#00D4FF] font-bold block">
                    {trimResult.reductionPercent > 0 ? `-${trimResult.reductionPercent}% smaller` : 'Optimized'}
                  </span>
                </div>
              </div>

              {/* Over 25MB Size Limit Banner */}
              {trimResult.trimmedSize > 25 * 1024 * 1024 && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-rose-200">Trimmed file exceeds 25 MB limit</p>
                    <p className="text-[11px] text-rose-300/90">
                      The trimmed segment is {formatFileSize(trimResult.trimmedSize)}. The maximum allowed upload size is 25 MB. Please click &ldquo;Edit Again&rdquo; and select a shorter segment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-800/80 bg-[#020609]/70 shrink-0">
          {phase === 'editing' && (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={playSegmentPreview}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>▶</span>
                  <span>Preview Segment</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUploadOriginal(file)}
                  className="text-xs text-[#9BAFB3] hover:text-white underline transition-colors px-2 py-1"
                >
                  Skip Trimming
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTrim}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-[#69E7EA] text-[#020609] text-xs font-bold transition-all shadow-lg shadow-[#00D4FF]/20 flex items-center justify-center gap-1.5"
                >
                  <span>✂️</span>
                  <span>Confirm Trim</span>
                </button>
              </div>
            </>
          )}

          {phase === 'preview' && trimResult && (
            <>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPhase('editing')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  ← Edit Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors px-2"
                >
                  Discard
                </button>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  disabled={trimResult.trimmedSize > 25 * 1024 * 1024}
                  onClick={() => onConfirmTrimmed(trimResult.trimmedFile, trimResult)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-2"
                >
                  <span>☁️</span>
                  <span>Upload Trimmed Video ({formatFileSize(trimResult.trimmedSize)})</span>
                </button>
              </div>
            </>
          )}

          {phase === 'processing' && (
            <div className="w-full text-center text-xs text-[#9BAFB3] italic">
              Please wait while the video is trimmed in your browser...
            </div>
          )}

          {phase === 'loading' && (
            <div className="w-full text-center text-xs text-[#9BAFB3]">
              Loading specimen media...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
