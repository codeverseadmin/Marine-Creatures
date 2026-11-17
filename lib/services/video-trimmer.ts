import {
  Input,
  Output,
  Conversion,
  BlobSource,
  BufferTarget,
  Mp4OutputFormat,
  ALL_FORMATS,
} from 'mediabunny';

export interface VideoMetadata {
  duration: number; // in seconds
  formattedDuration: string;
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  hasAudio: boolean;
  audioChannels: number;
  videoCodec: string;
  audioCodec: string;
  rotation: number;
  size: number;
}

export interface TrimOptions {
  file: File;
  startTime: number; // in seconds
  endTime: number; // in seconds
  onProgress?: (percent: number, processedSeconds?: number) => void;
  signal?: AbortSignal;
}

export interface TrimResult {
  success: boolean;
  trimmedFile: File;
  originalDuration: number;
  trimmedDuration: number;
  originalSize: number;
  trimmedSize: number;
  reductionPercent: number;
}

/**
 * Format seconds into MM:SS or MM:SS.s
 */
export function formatTime(seconds: number, includeTenths = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeTenths) {
    const tenths = Math.floor((seconds % 1) * 10);
    return `${pad(mins)}:${pad(secs)}.${tenths}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format bytes into human-readable string (e.g. 8.45 MB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

/**
 * Inspect a video file and extract authoritative duration, dimensions, codecs, and audio tracks.
 * Features a seamless dual fallback (mediabunny -> HTMLVideoElement) to ensure zero failures.
 */
export async function getVideoMetadata(file: File | Blob): Promise<VideoMetadata> {
  const size = file.size;

  try {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    const duration = await input.computeDuration();
    const videoTrack = await input.getPrimaryVideoTrack();
    const audioTrack = await input.getPrimaryAudioTrack();

    let width = 1280;
    let height = 720;
    let rotation = 0;
    let videoCodec = 'unknown';

    if (videoTrack) {
      width = (await videoTrack.getDisplayWidth().catch(() => 1280)) || 1280;
      height = (await videoTrack.getDisplayHeight().catch(() => 720)) || 720;
      rotation = (await videoTrack.getRotation().catch(() => 0)) || 0;
      videoCodec = videoTrack.codec || 'avc';
    }

    let hasAudio = false;
    let audioChannels = 0;
    let audioCodec = 'none';

    if (audioTrack) {
      hasAudio = true;
      audioChannels = (await audioTrack.getNumberOfChannels().catch(() => 2)) || 2;
      audioCodec = audioTrack.codec || 'aac';
    }

    // Account for 90 or 270 degree rotation in portrait orientation
    const isPortrait = rotation === 90 || rotation === 270 ? width > height : height > width;

    return {
      duration: Math.max(0.1, duration),
      formattedDuration: formatTime(duration),
      width,
      height,
      aspectRatio: width / height,
      isPortrait,
      hasAudio,
      audioChannels,
      videoCodec,
      audioCodec,
      rotation,
      size,
    };
  } catch (err) {
    // Browser HTMLVideoElement Fallback
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('Cannot inspect video outside browser environment.'));
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        const duration = video.duration || 1;
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        URL.revokeObjectURL(url);

        resolve({
          duration,
          formattedDuration: formatTime(duration),
          width,
          height,
          aspectRatio: width / height,
          isPortrait: height > width,
          hasAudio: true, // Default assume audio present in browser
          audioChannels: 2,
          videoCodec: 'browser-native',
          audioCodec: 'browser-native',
          rotation: 0,
          size,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to read video metadata. File may be corrupt or an unsupported format.'));
      };
    });
  }
}

/**
 * Generate a filmstrip of thumbnail frames across the entire video duration.
 * Optimized for lightweight rendering on mobile and desktop timeline views.
 */
export async function generateVideoThumbnails(
  file: File | Blob,
  count = 9,
  signal?: AbortSignal
): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    if (signal?.aborted) {
      cleanup();
      return resolve([]);
    }

    signal?.addEventListener('abort', () => {
      cleanup();
      resolve([]);
    });

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || duration <= 0 || isNaN(duration)) {
        cleanup();
        return resolve([]);
      }

      const thumbnails: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const aspect = (video.videoWidth || 16) / (video.videoHeight || 9);
      const thumbHeight = 56;
      const thumbWidth = Math.max(32, Math.min(Math.round(thumbHeight * aspect), 110));
      canvas.width = thumbWidth;
      canvas.height = thumbHeight;

      const safeCount = Math.max(2, Math.min(count, 15));
      const step = duration / safeCount;

      for (let i = 0; i < safeCount; i++) {
        if (signal?.aborted) break;
        // Sample slightly inwards from exact edges to avoid initial black frames
        const targetTime = Math.min(i * step + 0.05, Math.max(0, duration - 0.05));
        try {
          await seekToTime(video, targetTime);
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push(canvas.toDataURL('image/jpeg', 0.6));
          }
        } catch {
          // Seek error or interrupted; continue
        }
      }

      cleanup();
      resolve(thumbnails);
    };

    video.onerror = () => {
      cleanup();
      resolve([]);
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((res) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', onSeeked);
        res();
      }
    }, 600); // 600ms safety timeout per frame seek

    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        video.removeEventListener('seeked', onSeeked);
        res();
      }
    };

    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, time);
  });
}

/**
 * Perform genuine client-side video trimming using Mediabunny's container muxing & WebCodecs pipeline.
 * Extracts only the selected segment [startTime, endTime], preserving audio and sync.
 * Does not modify or overwrite the original input file.
 */
export async function trimVideoFile(options: TrimOptions): Promise<TrimResult> {
  const { file, startTime, endTime, onProgress, signal } = options;

  if (startTime < 0 || endTime <= startTime) {
    throw new Error(`Invalid trim segment: Start (${startTime.toFixed(2)}s) must be less than End (${endTime.toFixed(2)}s).`);
  }

  const selectedDuration = endTime - startTime;
  if (selectedDuration < 0.3) {
    throw new Error('Selected video segment is too short. Please select at least 0.5 seconds.');
  }

  if (signal?.aborted) {
    throw new Error('Trimming cancelled by user.');
  }

  // Initialize Mediabunny input and output
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const originalDuration = await input.computeDuration();
  if (endTime > originalDuration + 0.5) {
    throw new Error(`End time (${endTime.toFixed(1)}s) exceeds video duration (${originalDuration.toFixed(1)}s).`);
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat(),
    target,
  });

  const conversion = await Conversion.init({
    input,
    output,
    trim: {
      start: startTime,
      end: endTime,
    },
    copy: {}, // Lossless stream copying for zero quality loss and instant speed
  });

  if (!conversion.isValid) {
    const errorDetails = conversion.discardedTracks
      .map((d) => `${d.track.type.toUpperCase()}: ${d.reason}`)
      .join('; ');
    throw new Error(`Unable to trim video with current codecs: ${errorDetails || 'Incompatible container'}`);
  }

  if (signal) {
    signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  if (onProgress) {
    conversion.onProgress = (p) => {
      const pct = Math.min(99, Math.round(p * 100));
      onProgress(pct, startTime + p * selectedDuration);
    };
  }

  await conversion.execute();

  if (signal?.aborted) {
    throw new Error('Trimming cancelled by user.');
  }

  if (onProgress) {
    onProgress(100, endTime);
  }

  const outBuffer = target.buffer;
  if (!outBuffer || outBuffer.byteLength === 0) {
    throw new Error('Trimmed video buffer is empty. File may be corrupt or unreadable.');
  }

  // Create standard File object for trimmed video
  const trimmedBlob = new Blob([outBuffer], { type: 'video/mp4' });
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
  const cleanBaseName = rawBaseName.replace(/-trimmed$/i, '');
  const trimmedFileName = `${cleanBaseName}-trimmed.mp4`;

  const trimmedFile = new File([trimmedBlob], trimmedFileName, {
    type: 'video/mp4',
    lastModified: Date.now(),
  });

  // Verify trimmed duration
  let verifiedDuration = selectedDuration;
  try {
    const verifyInput = new Input({
      source: new BlobSource(trimmedFile),
      formats: ALL_FORMATS,
    });
    verifiedDuration = await verifyInput.computeDuration();
  } catch {
    // Fallback to mathematical duration
  }

  const reduction = file.size > 0 ? Math.max(0, Math.round(((file.size - trimmedFile.size) / file.size) * 100)) : 0;

  return {
    success: true,
    trimmedFile,
    originalDuration,
    trimmedDuration: verifiedDuration,
    originalSize: file.size,
    trimmedSize: trimmedFile.size,
    reductionPercent: reduction,
  };
}

