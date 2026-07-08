# BuildTarget

Pick a target athletic **physique archetype** (swimmer, sprinter, gymnast, …),
upload a photo of yourself, and get an AI-generated comparison plus specific gym
exercise recommendations to move your current build toward that target. After
the first analysis, keep chatting to ask follow-up questions.

**BuildTarget is not a medical or diagnostic tool.** It gives general training
information, framed as "here's your path from A to B" — never a judgment of your
current body.

---

## How it works

```
browser  →  /api/chat (serverless proxy)  →  Anthropic API  →  back to browser
```

- **Frontend:** React + TypeScript + Vite + Tailwind CSS. Local React state
  only — no database.
- **Backend:** one serverless function (`api/chat.ts`) that validates the
  request, rate-limits it, injects the coaching system prompt and the API key,
  and forwards to the Anthropic Messages API using vision (image blocks).
- **The `ANTHROPIC_API_KEY` never reaches the browser.** It is read only inside
  the serverless function, from a server-side environment variable.
- **Model:** `claude-sonnet-4-6` (vision), `max_tokens: 600`.

---

## Local development

Requires Node 18+.

```bash
npm install
```

You need the Vercel CLI to run the serverless function locally (plain `vite dev`
serves the frontend but not `/api/chat`):

```bash
npm i -g vercel

# Create a local env file with your key (never commit it — .env is gitignored):
cp .env.example .env
#  → edit .env and set ANTHROPIC_API_KEY=sk-ant-...

vercel dev        # serves the app + /api/chat together, typically on :3000
```

Get an API key from the [Anthropic Console](https://console.anthropic.com/).

> Running only the frontend? `npm run dev` starts Vite and proxies `/api` to
> `http://localhost:3000`, so pair it with `vercel dev` if you split them.
> Without a running function, uploads will surface a friendly "couldn't reach
> the server" error (the app stays fully usable up to that point).

Other scripts:

```bash
npm run build       # type-check (app + function) and produce a production build
npm run typecheck   # type-check only
```

---

## Deploy to Vercel (one command)

```bash
npm i -g vercel
vercel            # first run links/creates the project
vercel --prod     # deploy to production
```

**Before it will work, set the API key in the Vercel project** (do this once;
it is never committed):

- Vercel Dashboard → your project → **Settings → Environment Variables** → add
  `ANTHROPIC_API_KEY` with your key, for the Production (and Preview) environments.
- Or via CLI: `vercel env add ANTHROPIC_API_KEY`.

Vercel auto-detects the Vite frontend and the `api/` serverless function; no
extra configuration is needed. If the key is missing at runtime, users see a
generic "service unavailable" message and the specific cause is logged in the
function logs (never exposed to the client).

> **Netlify:** the same code works with a Netlify Function — move `api/chat.ts`
> to `netlify/functions/chat.ts`, adapt the handler signature to Netlify's
> `(event, context)` shape, and set `ANTHROPIC_API_KEY` in Netlify's env
> settings. Vercel is the primary, tested target.

---

## Privacy & data handling

- Uploaded photos are sent to the Anthropic API for analysis and are **not
  stored** in any database or file storage — there is no backend persistence
  layer in this v1.
- The photo is kept **in memory (React state) only** for the session, so
  follow-up questions still have context. It is **never** written to
  `localStorage` or any other client-side storage. A page refresh clears it and
  requires re-uploading.
- The serverless function **never logs image data or message content** — only
  metadata (status code, turn count, output tokens, latency, error type).
- The upload screen states plainly, where the upload happens, that the photo is
  sent to the AI and isn't stored.

---

## Security & cost controls

The proxy is public (no per-user auth in v1), so it defends itself:

- **Server-side validation** (client checks are bypassable): rejects requests
  that aren't the expected JSON shape, that lack an image on the first message,
  that carry an image over ~5MB, that exceed 30 messages, or that contain any
  content-block type other than `text`/`image` (blocks e.g. `tool_use`
  injection that would turn this into a general-purpose agent proxy).
- **Rate limiting:** ~20 requests/hour per IP, in-memory. **This resets on every
  cold start / redeploy.** A production deployment with real traffic should back
  this with a durable store (e.g. Redis / Upstash).
- **Bounded cost:** `max_tokens` is capped at 600, conversations are capped at
  30 messages, and images are downscaled client-side (long edge ≤ 1568px) — so
  a single user cannot run up an unbounded bill.
- **No secret leakage:** the API key, endpoint URL, system prompt, and model
  string exist only in the serverless function — none are present in the client
  bundle. Upstream/API errors are logged as metadata only and surfaced to the
  client as friendly, generic messages.

---

## Adding an archetype

Add one entry to the `ARCHETYPES` array in `src/archetypes.ts`. Nothing else
needs to change — the grid, the prompt injection, and the chat all read from
that array. Each entry has a `label` (shown), a short `teaser` (shown on the
card), and a detailed `description` (injected into the AI prompt, never shown).

---

## Assumptions and deviations from spec

Per the "act as a self-critical senior engineer" instruction, here is
everything I changed, added, or decided beyond a literal reading of the spec,
and why.

1. **Model choice honored as specified, against my usual default.** The spec
   pins `claude-sonnet-4-6`. My standing guidance is to default to the latest
   Opus model unless a model is explicitly named — but the spec *does* name one
   explicitly, so I used `claude-sonnet-4-6` (it supports vision and is a
   sensible cost/quality fit for this product). Changing the model is a
   one-line edit in `api/chat.ts`.

2. **Removed `capture="environment"` from the file input.** The spec suggested
   *considering* it. In practice, `capture` makes many mobile browsers open the
   live camera directly and **drop the "choose from library" option**. A
   full-body physique photo is almost always an existing shot or a mirror/timer
   photo, so forcing the live camera is worse UX. Omitting `capture` lets the
   native picker offer both camera and gallery. `accept` still limits to images.

3. **No `localStorage` persistence at all (declined the optional refresh
   survival).** The spec allows optionally persisting chat text + archetype
   (never the image) across refreshes. I deliberately did **not**, because a
   restored conversation without its original photo is a half-broken state (the
   AI's context is the photo; follow-ups would be grounded in an image the
   session no longer has). Cleaner privacy story and no confusing partial state.
   A refresh cleanly returns to the start.

4. **Client compression targets ~3.5MB, not the ~5MB ceiling.** Vercel
   serverless functions cap request bodies at ~4.5MB. Since the whole
   conversation (including the base64 image) is JSON in one request body, I
   compress the image to comfortably under that so real requests fit, while the
   server still enforces the spec's ~5MB *per-image* check as a hard backstop
   against direct callers.

5. **Server-side rejection of unknown content-block types.** Beyond the
   validations the spec listed, the proxy also rejects any block that isn't
   `text` or `image`. Without this, a direct caller could inject `tool_use` or
   other blocks and repurpose the endpoint. This keeps it scoped to the product.

6. **Assistant messages stored as plain strings.** The API returns text; the
   client stores each assistant turn as a string. This keeps the conversation
   history small and the render logic simple, and matches the Messages API's
   acceptance of string content.

7. **Renamed nothing / kept the working name "BuildTarget."** It's clear and on
   brand for a fitness product. (The spec invited a better name; this one works.)

8. **Accessibility baseline implemented concretely:** archetype cards and the
   upload dropzone are real `<button>`s (keyboard-operable, verified via
   Tab/Enter), the dropzone and icon-only affordances have `aria-label`s, there
   is a global visible `:focus-visible` ring, the chat log uses
   `role="log"`/`aria-live`, errors use `role="alert"`, the uploaded photo has
   descriptive `alt` text, and `prefers-reduced-motion` is respected.

### Known limitations / future work (not blocking v1)

- **Rate limiting is in-memory** and resets on cold start; move to a durable
  store for production traffic (noted above).
- **No prompt caching.** Because the API is stateless, the uploaded image is
  re-sent on every follow-up turn. Cost is already bounded by the message and
  token caps, but adding `cache_control` to the first turn would reduce
  per-turn input-token cost in longer conversations.
- **No CORS allow-list.** The endpoint relies on rate limiting rather than an
  origin check (origins are trivially spoofable by non-browser callers, so an
  allow-list would be security theater without real auth). Add real per-user
  auth before exposing this at scale.

---

## Self-review pass (security / cost / privacy / accessibility)

A second pass after the app was working, per the build instructions:

- **Security:** confirmed the key/endpoint/system-prompt/model are absent from
  the built client bundle; verified (via automated tests) that the endpoint
  rejects wrong methods, missing/oversized images, over-long conversations,
  malformed bodies, and disallowed block types, and that it never forwards
  client-supplied `model`/`system`. **Fixed:** added the unknown-block-type
  rejection (item 5 above) after noticing the endpoint would otherwise accept
  arbitrary block types.
- **Cost:** `max_tokens` 600, 30-message cap, per-IP rate limit, and
  client-side downscaling together bound spend per user. No unbounded path
  found.
- **Privacy:** verified the image is never persisted client-side and never
  logged server-side (logging is metadata-only). **Fixed:** confirmed and
  removed an early instinct to add `localStorage` session survival (item 3).
- **Accessibility:** verified keyboard operation of the full flow (select →
  upload → chat → start over) and screen-reader affordances in an automated
  browser pass. **Fixed:** dropped `capture` (item 2), which would have blocked
  gallery selection for many users, and replaced an HTML-entity error string
  that was being rendered via `dangerouslySetInnerHTML` with plain text.
