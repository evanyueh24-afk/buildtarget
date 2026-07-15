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
- [x] Deeper (not broader) in-domain scope: system prompt now explicitly covers
      sleep, recovery/rest days, injury-aware training, GENERAL nutrition
      (protein ranges / meal-timing basics only — no calorie targets, macros, or
      diet plans), practical consistency/motivation, and mobility/flexibility.
      Redirect boundary for genuinely unrelated topics kept.
- [x] Quick-start suggestion chips in chat ("How's my recovery?", "Any injuries
      to work around?", "What should I eat around training?") shown after the
      first analysis so users discover the wider scope.
- [x] Age gate (14+) before gender selection, remembered via a localStorage flag
      (`bt_age_ok`); system prompt rule 11 tells the AI to stop and require
      parent/guardian confirmation if the user appears to be a minor.
- [x] Plain-language Privacy Policy + Terms of Service (one page each), linked
      from the footer, opened as an accessible dialog.
- [x] Post-analysis "goal card": shows the archetype's reference build (honest
      visual target, not a doctored photo of the user) + a "See your projected
      progress" button that requests a realistic, training-focused text roadmap
      (3/6/12-month milestones). Deliberately NOT AI image generation of the
      user's future body — that was declined as misleading + a likeness/minor-
      safety risk, and Claude can't generate images anyway. System prompt rule
      12 makes the AI decline "photo of my future body" requests and offer the
      roadmap instead.
- [x] Visual redesign (minimal, dark, athlete-focused): palette moved to CSS
      variable tokens (bg #0a0c10, surface #12151c, confident-blue accent
      #3b82f6 replacing the orange/rust throughout, off-white text, muted
      blue-grey secondary). Start screen anchored by a large bold hero headline
      ("Train toward a physique.") with a short subhead and generous spacing;
      archetype picker restyled to match. Accent carried app-wide via the single
      `accent` token. Functionality unchanged; verified on 375px and desktop.

## Item-3 audit findings

- **Leftover debug code — STILL OPEN:** the TEMP diagnostic block in
  `api/chat.ts` (503 path returns keyPresent/keyLength/VERCEL_ENV/commit/
  deploymentId) is still present, kept intentionally as the only lever on the
  unresolved live 503. Next: capture it once from the live app, then remove.
  The `console.*` calls are intentional metadata-only logging — keep.
- **Rate limit (current, unchanged):** 20 requests/hour per IP, in-memory
  (resets on cold start/redeploy). Other bounds: 30 messages/convo, 5MB/image,
  max_tokens 600. (Report only — no change requested.)
- **A11y — focus on step transitions — FIXED:** focus now moves to the new
  screen's heading (chat view falls back to its region) on every transition.
- **A11y — legal dialog focus-trap — FIXED:** Tab and Shift+Tab now wrap within
  the dialog; Escape/close/focus-return still work.
- **A11y — low-contrast small text — FIXED:** timestamps and footer text bumped
  from slate-500 to slate-400.
- **A11y OK (unchanged):** all controls are real buttons/inputs, reachable and
  Enter-operable; cards use `aria-pressed`; images have `alt`; chat log is
  `role="log"`/`aria-live`; global visible focus ring; reduced-motion respected;
  icon-only buttons have `aria-label`.

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
