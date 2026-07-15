import type { ProcessedImage } from '../types';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface EncodeOpts {
  /** Max pixels on the long edge. */
  maxEdge: number;
  /** Shrink JPEG quality until the base64 payload is under this many bytes. */
  targetBytes: number;
}

// The user's photo and the archetype reference photo are BOTH sent in one
// request now, so keep each well under the serverless body limit (~4.5MB on
// Vercel). Worst case ~2.8MB + ~1.0MB base64 leaves headroom; in practice both
// are far smaller. Reference is capped smaller since it's only a visual guide.
const USER_OPTS: EncodeOpts = { maxEdge: 1568, targetBytes: 2_800_000 };
const REFERENCE_OPTS: EncodeOpts = { maxEdge: 1024, targetBytes: 1_000_000 };

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

function loadFromSrc(src: string, onLoaded?: () => void): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      onLoaded?.();
      resolve(img);
    };
    img.onerror = () => {
      onLoaded?.();
      reject(new Error('无法读取该图片，请换一个文件试试。'));
    };
    img.src = src;
  });
}

/** Resize (long edge <= opts.maxEdge) and re-encode to JPEG, shrinking quality
 *  until under opts.targetBytes. Runs entirely client-side; returns an
 *  in-memory result only — nothing is persisted. */
function encode(img: HTMLImageElement, opts: EncodeOpts): ProcessedImage {
  const scale = Math.min(1, opts.maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('你的浏览器无法处理该图片。');
  ctx.drawImage(img, 0, 0, width, height);

  const mediaType = 'image/jpeg';
  let quality = 0.85;
  let dataUrl = canvas.toDataURL(mediaType, quality);
  while (base64Bytes(dataUrl) > opts.targetBytes && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL(mediaType, quality);
  }

  const base64 = dataUrl.split(',')[1] ?? '';
  return { base64, mediaType, previewUrl: dataUrl };
}

/** Process a user-uploaded photo (from the file picker / drop). */
export async function processImage(file: File): Promise<ProcessedImage> {
  const url = URL.createObjectURL(file);
  const img = await loadFromSrc(url, () => URL.revokeObjectURL(url));
  return encode(img, USER_OPTS);
}

/** Process an archetype's bundled reference photo (same-origin asset URL) into
 *  a smaller image block to send alongside the user's photo. */
export async function processReferenceImage(url: string): Promise<ProcessedImage> {
  const img = await loadFromSrc(url);
  return encode(img, REFERENCE_OPTS);
}

/** Approximate decoded byte length of a data URL's base64 portion. */
function base64Bytes(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] ?? '';
  return Math.floor((b64.length * 3) / 4);
}
