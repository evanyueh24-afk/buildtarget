import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ApiMessage } from '../types';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  archetype: Archetype;
  gender: Gender;
  previewUrl: string;
  messages: ApiMessage[];
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry: () => void;
}

export function ChatView({
  archetype,
  gender,
  previewUrl,
  messages,
  loading,
  error,
  onSend,
  onRetry,
}: Props) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message / indicator in view as the conversation grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, loading, error]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    onSend(text);
    setDraft('');
  }

  return (
    <section aria-label="Coaching conversation" className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <div className="mb-3 shrink-0 text-sm text-slate-400">
        Target physique: <span className="font-semibold text-slate-100">{archetype.label}</span>
        <span className="mx-1 text-slate-600">·</span>
        <span className="font-semibold text-slate-100">{genderLabel(gender)}</span>
      </div>

      <div
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-4"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {messages.map((m, i) => {
          // First user turn carries the image + hidden prompt: render as a thumbnail.
          if (i === 0 && m.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <figure className="max-w-[60%]">
                  <img
                    src={previewUrl}
                    alt="The photo you uploaded for analysis"
                    className="rounded-2xl rounded-br-sm border border-ink-700"
                  />
                  <figcaption className="mt-1 text-right text-xs text-slate-500">
                    Comparing to {archetype.label}
                  </figcaption>
                </figure>
              </div>
            );
          }

          const text = typeof m.content === 'string' ? m.content : '';
          if (!text) return null;
          return (
            <ChatBubble key={i} role={m.role}>
              {text}
            </ChatBubble>
          );
        })}

        {loading && <TypingIndicator />}

        {error && (
          <div role="alert" className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200 sm:max-w-[75%]">
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-md bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100 hover:bg-red-500/30"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex shrink-0 items-end gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Ask a follow-up question
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              submit(e);
            }
          }}
          rows={1}
          placeholder="Ask a follow-up… (e.g. how many days a week should I train this?)"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || draft.trim().length === 0}
          className="h-[2.75rem] shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
