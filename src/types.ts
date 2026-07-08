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

/** A processed, in-memory image ready to send to the API. Never persisted. */
export interface ProcessedImage {
  /** base64 (no data: prefix) — what the API needs. */
  base64: string;
  /** e.g. "image/jpeg" */
  mediaType: string;
  /** full data URL for rendering the thumbnail in the browser. */
  previewUrl: string;
}
