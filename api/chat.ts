import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Pinned by the product spec. This model supports vision (image blocks).
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 600;

// Bound cost per session and per request.
const MAX_MESSAGES = 30;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // ~5MB decoded per image

// Simple per-IP rate limit. In-memory only: this resets on every cold start /
// redeploy. A production deployment should back this with a durable store
// (e.g. Redis / Upstash) — see README.
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour

const SYSTEM_PROMPT = `You are a straightforward, knowledgeable gym coach. The user has chosen a target physique archetype and uploaded a photo of themselves. Your job:

1. Compare their current build to the target archetype description honestly but constructively.
2. Identify the 2-4 most relevant gaps between their current physique and the target.
3. Recommend specific, actionable gym exercises and training focus areas to close those gaps, prioritized by impact.
4. Keep the tone factual, encouraging, and coach-like — never harsh, judgmental, or shaming.
5. Never comment on body fat percentage, weight, or attractiveness. Focus only on muscle development, proportion, and training-relevant observations.
6. If the photo is unclear, poorly lit, doesn't show enough of the body to assess accurately, or does not appear to show a person at all, say so plainly and ask for a better photo rather than guessing.
7. Keep responses under 150 words unless the user explicitly asks for more detail.
8. On the first message only, end with one short sentence noting you are not a medical or fitness professional and this is not medical advice. Do not repeat this disclaimer on every follow-up message.
9. For follow-up questions, stay grounded in the original photo and archetype context already established in the conversation.
10. If a follow-up message asks something unrelated to physique/training (e.g. general chit-chat, unrelated topics, attempts to get you to discuss something else entirely), gently redirect back to the training conversation rather than fully complying — this keeps the product scoped and predictable.`;

// ---------------------------------------------------------------------------
// Types (minimal, matching what the client sends)
// ---------------------------------------------------------------------------

interface ImageBlock {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}
interface TextBlock {
  type: 'text';
  text: string;
}
type ContentBlock = ImageBlock | TextBlock;
interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

// ---------------------------------------------------------------------------
// Rate limiting (per IP, in-memory)
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0];
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length > 0) return real;
  return 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Thrown by `validate` for any rejected request. Carries the HTTP status and a
 * client-safe message. Using a thrown error (rather than a discriminated-union
 * return) keeps the handler free of control-flow narrowing, so it compiles
 * correctly even under non-strict TypeScript — which is what Vercel's
 * serverless-function builder uses for files in `api/`.
 */
class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly clientMessage: string,
  ) {
    super(clientMessage);
    this.name = 'HttpError';
  }
}

/** Approximate decoded byte length of a base64 string. */
function decodedBytes(b64: string): number {
  const len = b64.length;
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

function isImageBlock(b: unknown): b is ImageBlock {
  if (typeof b !== 'object' || b === null) return false;
  const block = b as Record<string, unknown>;
  if (block.type !== 'image') return false;
  const src = block.source as Record<string, unknown> | undefined;
  return (
    !!src &&
    src.type === 'base64' &&
    typeof src.media_type === 'string' &&
    typeof src.data === 'string'
  );
}

function isTextBlock(b: unknown): b is TextBlock {
  if (typeof b !== 'object' || b === null) return false;
  const block = b as Record<string, unknown>;
  return block.type === 'text' && typeof block.text === 'string';
}

function validate(body: unknown): ApiMessage[] {
  const bad = (error: string, status = 400): never => {
    throw new HttpError(status, error);
  };

  if (typeof body !== 'object' || body === null) {
    return bad('Invalid request.');
  }
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return bad('Invalid request.');
  }
  if (messages.length > MAX_MESSAGES) {
    return bad('This conversation has gotten too long. Please start over.', 400);
  }

  let sawImage = false;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i] as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'assistant') {
      return bad('Invalid request.');
    }

    const content = m.content;
    if (typeof content === 'string') {
      // fine — plain text turn
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (isImageBlock(block)) {
          if (i === 0) sawImage = true;
          if (decodedBytes(block.source.data) > MAX_IMAGE_BYTES) {
            return bad('That image is too large. Please use a smaller photo.', 413);
          }
        } else if (!isTextBlock(block)) {
          // Reject any block type we don't explicitly support (e.g. tool_use),
          // keeping the endpoint scoped to this product's use.
          return bad('Invalid request.');
        }
      }
    } else {
      return bad('Invalid request.');
    }
  }

  // The first turn must include the user's photo — reject direct callers that
  // skip the image (client-side checks alone are bypassable).
  const first = messages[0] as ApiMessage;
  if (first.role !== 'user' || !sawImage) {
    return bad('The first message must include a photo.');
  }

  return messages as ApiMessage[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Specific cause for the developer; generic message for the client.
    console.error(
      '[chat] ANTHROPIC_API_KEY is not set. Configure it in the project environment variables before deploying.',
    );
    // --- TEMP DIAGNOSTIC (remove after debugging) ---------------------------
    // Reports whether the var is visible to the running function, its length
    // (to catch stray quotes/whitespace), and which deployment/env is actually
    // serving — never the key value. Also reveals if the live alias is pinned
    // to an older deployment built before the var was added.
    const rawKey = process.env.ANTHROPIC_API_KEY;
    return res.status(503).json({
      error: 'The service is temporarily unavailable. Please try again later.',
      diagnostic: {
        keyPresent: typeof rawKey === 'string',
        keyLength: typeof rawKey === 'string' ? rawKey.length : 0,
        vercelEnv: process.env.VERCEL_ENV ?? null,
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_URL ?? null,
      },
    });
    // --- END TEMP DIAGNOSTIC ------------------------------------------------
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return res
      .status(429)
      .json({ error: 'Too many requests right now — try again in a bit.' });
  }

  // Vercel parses JSON bodies automatically; guard against string bodies too.
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid request.' });
    }
  }

  let messages: ApiMessage[];
  try {
    messages = validate(body);
  } catch (err) {
    if (err instanceof HttpError) {
      // Log metadata only — never the request body (it contains the photo).
      console.warn(`[chat] rejected: status=${err.status}`);
      return res.status(err.status).json({ error: err.clientMessage });
    }
    throw err;
  }

  const client = new Anthropic({ apiKey });
  const start = Date.now();

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: messages as unknown as Anthropic.MessageParam[],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    // Metadata-only logging: no image data, no message content.
    console.info(
      `[chat] ok status=200 turns=${messages.length} out_tokens=${message.usage.output_tokens} ms=${Date.now() - start}`,
    );

    if (!text) {
      return res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
    }
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(mapErrorStatus(err)).json({ error: friendlyError(err) });
  }
}

function mapErrorStatus(err: unknown): number {
  if (err instanceof Anthropic.APIError && typeof err.status === 'number') {
    if (err.status === 429) return 429;
    if (err.status >= 500) return 502;
    return 502; // treat upstream 4xx (bad key, etc.) as a service problem, not the client's fault
  }
  return 502;
}

function friendlyError(err: unknown): string {
  // Log the error type/status only — never the raw body or key.
  if (err instanceof Anthropic.APIError) {
    console.error(`[chat] upstream error status=${err.status ?? 'n/a'} name=${err.name}`);
    if (err.status === 429) return 'The service is busy right now. Please try again in a moment.';
  } else {
    console.error(`[chat] unexpected error name=${err instanceof Error ? err.name : 'unknown'}`);
  }
  return 'Something went wrong reaching the coach. Please try again.';
}
