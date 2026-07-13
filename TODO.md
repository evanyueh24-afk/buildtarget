# BuildTarget — TODO / status

## Done

- [x] Gender selection step (Male / Female) before the archetype picker.
- [x] 9 male + 9 female archetypes, gender-appropriate framing in the analysis
      prompt (no male-default V-taper assumptions).
- [x] Real reference photos on all 18 cards (`src/assets/archetypes/`), matched
      by filename; silhouette placeholder remains only as a fallback.
- [x] Athlete-name text captions per card (text only — never sent as image input).
- [x] Two-image visual comparison: the user's photo **and** the archetype's
      reference photo are sent to the model; system prompt instructs a visual
      comparison. Reference image compressed smaller to bound request size.
- [x] Chat UX polish:
  - [x] Attach images on follow-up messages (paperclip button, up to 4/message,
        same resize/compress/validation as the initial upload).
  - [x] Markdown rendering of AI responses (bold, lists, headings, code) via
        react-markdown — no raw asterisks.
  - [x] Per-message timestamps, message-entrance animation, smoother auto-scroll,
        polished typing indicator.
  - [x] Multi-turn image context: new attached photos are sent as a new user
        turn; the system prompt tells the AI to treat them as new information
        (progress / another angle), not a from-scratch re-analysis.
- [x] Scope guardrails preserved: off-topic redirect (rule 10) and the
      never-comment-on-weight/body-fat/attractiveness rule (rule 5) unchanged;
      attached images subject to the same "unclear / not a person" handling.

## Outstanding / known limitations

- [ ] **Live 503 — deployment blocked.** The deployed app returns "service
      temporarily unavailable" from the `ANTHROPIC_API_KEY` check. A temporary
      diagnostic is in `api/chat.ts` (the 503 path returns keyPresent/keyLength/
      VERCEL_ENV/commit/deployment id). **Next step:** read that diagnostic from
      the live app, fix the env-var config, then REMOVE the temporary diagnostic.
- [ ] **Streaming is not actually enabled.** The proxy returns a full JSON
      response (`client.messages.create`), so the typing indicator shows until
      the whole reply arrives. Real token streaming (SSE from the function +
      client stream parsing) is a separate follow-up.
- [ ] **Cumulative request size.** Full history (including images) is resent
      each turn. Images are compressed and there's a 30-message cap, but a long
      conversation with several attached photos could approach the serverless
      body limit. Consider server-side pruning/downscaling of older image turns
      if this is hit in practice.
- [ ] **Rate limiting is in-memory** (per-IP, resets on cold start). Move to a
      durable store (e.g. Upstash/Redis) before real traffic.
- [ ] Optional: `favicon.ico` (currently 404 in dev/preview — harmless).
