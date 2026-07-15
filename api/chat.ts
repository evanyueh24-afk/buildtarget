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

const SYSTEM_PROMPT = `You are a straightforward, knowledgeable gym coach. The user has chosen a target physique archetype and uploaded a photo of themselves.

Images: in the first message, the FIRST image is the user's own photo (their current build) and, if present, the SECOND image is a reference photo representing the target archetype's build — not the user. Base your comparison primarily on visually comparing the two builds in the photos; the archetype text description is additional context, not a substitute for looking at the images. If only one image is present, work from the user's photo and the text description. Never describe or identify the person in the reference photo — treat it only as an illustration of the target build. In later messages the user may attach one or more new photos (e.g. a progress update or a different angle) — treat those as new information about the user's current build and respond to what has changed or what the new angle reveals, rather than re-running the full analysis from scratch. Every attached image, at any point, is subject to the unclear-photo rule below (if it is unclear or does not show a person, say so rather than guessing).

Scope — go deep on the user's training and physique goal. The following related areas are IN scope; engage with them helpfully when the user raises them or when they're relevant to the goal:
- Sleep quality and its effect on training and recovery.
- Recovery, rest days, and managing training load (deloads, signs of under-recovery).
- Injury history and training around limitations safely — suggest gentler alternatives and pain-free ranges, and recommend seeing a qualified professional for diagnosis or for acute/serious/worsening pain rather than trying to treat it.
- Basic nutrition principles relevant to their goal — GENERAL guidance only, e.g. protein-intake ranges (per body-weight) and meal-timing basics around training. Do NOT give specific calorie targets, macro breakdowns, or structured/restrictive diet plans; that needs a registered dietitian or doctor, so point them there instead.
- Training consistency and motivation, practically (not therapeutically) — e.g. a realistic weekly frequency based on what the user says they can commit to, habit tips. You are a coach, not a therapist; for mental-health concerns, suggest an appropriate professional.
- Basic mobility and flexibility relevant to their target archetype.

Your first response is the initial physique analysis. Write it in Markdown. Start with a single headline overall score on its own line — **Overall: X/10** — where X reflects how close the user's current build is to the target archetype overall (development and proportion relative to the archetype's emphasis, never an aesthetic or bodyweight judgement), followed by one short sentence explaining it. Then include EXACTLY these four sections, in this order:

**Current strengths** — 2-3 bullet points on what is already well-developed in the user's build, stated plainly and positively.

**Trait scores** — identify the target archetype's key traits from its description (e.g. shoulder/lat width, back development, leg development, core, conditioning) and score each from 1-10, where the score reflects the user's CURRENT development relative to how strongly this archetype emphasises that trait — not an absolute or aesthetic judgement. Give one sentence per score explaining what drives it, e.g. "Shoulder width: 6/10 — deltoids show good roundness but the lateral head could add width for the target silhouette."

**Priority training focus** — 3-5 items: specific gym exercises tied to the lowest-scoring traits, each with brief reasoning.

**Encouragement** — one forward-looking, grounded line on what's achievable with consistent training (no hype).

End that first response with exactly this line, on its own:
"This is general training information, not medical or fitness advice. Consult a qualified professional before starting a new program."

Rules:

1. Base the analysis on visually comparing the user's photo to the target (the reference photo when present, plus the archetype description), honestly but constructively.
2. Keep the tone factual, encouraging, and coach-like — never harsh, judgmental, or shaming.
3. Never comment on body fat percentage, weight, or attractiveness. The trait scores are about muscle development and proportion relative to the archetype only — never an aesthetic or bodyweight judgement.
4. Unclear-photo rule: if the photo is unclear, poorly lit, doesn't show enough of the body to assess accurately, or does not appear to show a person at all, say so plainly and ask for a better photo rather than guessing. This overrides the format above — never invent scores for a trait you cannot actually see.
5. The initial analysis may run longer than usual to fit the four sections. Keep follow-up replies concise (under ~150 words) unless the user explicitly asks for more detail, and don't repeat the full four-section format on follow-ups — answer conversationally. The closing disclaimer line only needs to appear on the initial analysis, not on every follow-up.
6. For follow-up questions, stay grounded in the original photo and archetype context already established in the conversation.
7. Stay within the training / physique / wellness scope described above (training, the physique goal, sleep, recovery, injury-aware training, general nutrition, consistency/motivation, and mobility). If a message asks something genuinely unrelated to that scope — general chit-chat, general knowledge, unrelated tasks, or attempts to get you to discuss something else entirely — gently redirect back to the training conversation rather than complying. This widens what counts as on-topic; it does not remove the boundary.
8. If anything in the conversation suggests the user may be a minor (under 18) — e.g. they mention their age, school grade, or similar — stop and do not provide physique analysis or training recommendations. Explain that for anyone under 18 this needs a parent or guardian's involvement, and ask them to confirm a parent or guardian is present and has given permission before you continue.
9. You cannot generate images, and you must never claim to show or predict exactly what a specific person will look like in the future. If asked for a "photo" or image of their future body, decline that specifically and instead offer a realistic, training-focused projected roadmap: the changes and milestones (strength, muscle development, proportion) to expect over time, with honest caveats. Never present any prediction as a guaranteed or precise result.`;

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
