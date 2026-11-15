/**
 * Marine Creatures — Client-Side Chunked Upload Service
 * Bypasses Vercel's 4.5 MB serverless limit by streaming files up to 25 MB in 2 MB chunks.
 */

export interface UploadProgress {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
  currentChunk: number;
  totalChunks: number;
}

export interface ChunkedUploadOptions {
  productId?: string;
  altText?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
  maxRetriesPerChunk?: number;
}

export interface ChunkedUploadResult {
  success: boolean;
  provider: string;
  url: string;
  mediaId: string;
  filename: string;
  size: number;
  type: 'image' | 'video';
  contentType: string;
  productId?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const DEFAULT_RETRIES = 5;

/**
 * Uploads a file of any size up to 25 MB using resilient 3-step chunked pipeline:
 * Step A: Authorize upload session & receive chunk plan
 * Step B: Upload 2 MB chunks sequentially with retry & progress reporting
 * Step C: Complete assembly & verify magic bytes in GridFS
 */
export async function uploadFileChunked(
  file: File | Blob,
  fileNameOrOptions?: string | ChunkedUploadOptions,
  maybeOptions?: ChunkedUploadOptions
): Promise<ChunkedUploadResult> {
  const filename =
    typeof fileNameOrOptions === 'string'
      ? fileNameOrOptions
      : (file as File).name || `upload-${Date.now()}`;

  const options: ChunkedUploadOptions =
    typeof fileNameOrOptions === 'object' ? fileNameOrOptions : maybeOptions || {};

  const size = file.size;
  const contentType = file.type || 'application/octet-stream';

  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File "${filename}" exceeds 25 MB limit (${(size / (1024 * 1024)).toFixed(1)} MB).`
    );
  }

  if (size === 0) {
    throw new Error(`File "${filename}" is empty (0 bytes).`);
  }

  if (options.signal?.aborted) {
    throw new Error('Upload cancelled by user.');
  }

  // ── Step A: Authorize Upload Session ──
  const authRes = await fetch('/api/admin/upload/authorize', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      contentType,
      size,
      productId: options.productId,
      altText: options.altText,
    }),
    signal: options.signal,
  });

  if (!authRes.ok) {
    const errData = await authRes.json().catch(() => ({}));
    throw new Error(errData.error || `Upload authorization failed (HTTP ${authRes.status})`);
  }

  const authData = await authRes.json();
  const { uploadId, chunkSize, totalChunks, expiresAt, signature } = authData;

  // ── Step B: Chunk Upload Loop ──
  const maxRetries = options.maxRetriesPerChunk ?? DEFAULT_RETRIES;
  let totalUploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (options.signal?.aborted) {
      throw new Error('Upload cancelled by user.');
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, size);
    const chunkBlob = file.slice(start, end, contentType);
    const chunkBytes = end - start;

    let chunkSuccess = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) {
        throw new Error('Upload cancelled by user.');
      }

      try {
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('size', size.toString());
        formData.append('contentType', contentType);
        formData.append('signature', signature);
        formData.append('expiresAt', expiresAt.toString());
        formData.append('chunk', chunkBlob, `${filename}.part${chunkIndex}`);

        const chunkAbortController = new AbortController();
        const timeoutId = setTimeout(() => chunkAbortController.abort(), 60000);

        const onUserAbort = () => chunkAbortController.abort();
        if (options.signal) {
          options.signal.addEventListener('abort', onUserAbort, { once: true });
        }

        let chunkRes: Response;
        try {
          chunkRes = await fetch('/api/admin/upload/chunk', {
            method: 'POST',
            credentials: 'include',
            body: formData,
            signal: chunkAbortController.signal,
          });
        } finally {
          clearTimeout(timeoutId);
          if (options.signal) {
            options.signal.removeEventListener('abort', onUserAbort);
          }
        }

        if (!chunkRes.ok) {
          const errData = await chunkRes.json().catch(() => ({}));
          throw new Error(errData.error || `Chunk ${chunkIndex + 1} failed (HTTP ${chunkRes.status})`);
        }

        chunkSuccess = true;
        break;
      } catch (err: any) {
        lastError = err;
        if (options.signal?.aborted) throw err;
        console.warn(`[ChunkedUpload] Chunk ${chunkIndex + 1}/${totalChunks} attempt ${attempt} failed:`, err?.message || err);
        // Exponential backoff before retry (1s, 2s, 3s, 4s...)
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.min(attempt * 1000, 4000)));
        }
      }
    }

    if (!chunkSuccess) {
      const isFetchErr =
        lastError?.name === 'TypeError' ||
        lastError?.name === 'AbortError' ||
        (lastError?.message && lastError.message.toLowerCase().includes('fetch'));
      const networkHint = isFetchErr
        ? 'Connection interrupted or server compiling. Click ↻ Retry Failed.'
        : lastError?.message || 'Network error';

      throw new Error(
        `Failed to upload chunk ${chunkIndex + 1}/${totalChunks} after ${maxRetries} attempts: ${networkHint}`
      );
    }

    totalUploadedBytes += chunkBytes;

    if (options.onProgress) {
      const percent = Math.min(95, Math.round((totalUploadedBytes / size) * 95));
      options.onProgress({
        percent,
        uploadedBytes: totalUploadedBytes,
        totalBytes: size,
        currentChunk: chunkIndex + 1,
        totalChunks,
      });
    }
  }

  // ── Step C: Complete & Verify Assembly ──
  const completeRes = await fetch('/api/admin/upload/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      filename,
      contentType,
      size,
      totalChunks,
      signature,
      expiresAt,
      productId: options.productId,
      altText: options.altText,
    }),
    signal: options.signal,
  });

  if (!completeRes.ok) {
    const errData = await completeRes.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to finalize upload (HTTP ${completeRes.status})`);
  }

  const result: ChunkedUploadResult = await completeRes.json();

  if (options.onProgress) {
    options.onProgress({
      percent: 100,
      uploadedBytes: size,
      totalBytes: size,
      currentChunk: totalChunks,
      totalChunks,
    });
  }

  return result;
}
