import type { ProcessedImage } from '../types';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Anthropic recommends a max of 1568px on the long edge. */
const MAX_EDGE = 1568;

/**
 * Target for the encoded base64 payload. We aim well under the serverless
 * body limit (Vercel functions cap request bodies at ~4.5MB) rather than at
 * the spec's ~5MB image ceiling, so a full JSON request comfortably fits.
 */
const TARGET_BASE64_BYTES = 3_500_000;

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image. Try a different file.'));
    };
    img.src = url;
  });
}

/**
 * Resize (long edge <= 1568px) and re-encode to JPEG in the browser, shrinking
 * quality until the payload is comfortably small. Runs entirely client-side;
 * the raw file never leaves the device un-processed. Returns an in-memory
 * result only — nothing is written to storage.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Your browser could not process the image.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  const mediaType = 'image/jpeg';
  let quality = 0.85;
  let dataUrl = canvas.toDataURL(mediaType, quality);

  // Step quality down until the base64 payload is under target (or we hit a floor).
  while (base64Bytes(dataUrl) > TARGET_BASE64_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL(mediaType, quality);
  }

  const base64 = dataUrl.split(',')[1] ?? '';
  return { base64, mediaType, previewUrl: dataUrl };
}

/** Approximate decoded byte length of a data URL's base64 portion. */
function base64Bytes(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] ?? '';
  return Math.floor((b64.length * 3) / 4);
}
