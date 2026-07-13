// Shared types for the Anthropic Messages API shape used between the browser,
// our serverless proxy, and the Anthropic API. Kept intentionally minimal —
// only the content-block variants this app actually sends.

export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export type ContentBlock = ImageBlock | TextBlock;

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

/**
 * A conversation turn as held in the UI: the API message plus display-only
 * metadata (timestamp). Stripped to `{ role, content }` before sending to the
 * proxy so the Anthropic request stays clean.
 */
export interface Turn {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
  /** epoch ms when the turn was created (display only). */
  ts: number;
}

/** A processed, in-memory image ready to send to the API. Never persisted. */
export interface ProcessedImage {
  /** base64 (no data: prefix) — what the API needs. */
  base64: string;
  /** e.g. "image/jpeg" */
  mediaType: string;
  /** full data URL for rendering the thumbnail in the browser. */
  previewUrl: string;
}
