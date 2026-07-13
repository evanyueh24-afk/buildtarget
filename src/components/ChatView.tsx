import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ProcessedImage, Turn } from '../types';
import { ACCEPTED_TYPES, isAcceptedImage, processImage } from '../lib/image';
import { imageBlockToDataUrl } from '../lib/message';
import { ChatBubble } from './ChatBubble';
import { Markdown } from './Markdown';
import { TypingIndicator } from './TypingIndicator';

const MAX_ATTACHMENTS = 4;

interface Props {
  archetype: Archetype;
  gender: Gender;
  /** The user's original uploaded photo, shown as the first turn's thumbnail. */
  previewUrl: string;
  turns: Turn[];
  loading: boolean;
  error: string | null;
  onSend: (text: string, attachments: ProcessedImage[]) => void;
  onRetry: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ChatView({
  archetype,
  gender,
  previewUrl,
  turns,
  loading,
  error,
  onSend,
  onRetry,
}: Props) {
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ProcessedImage[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, loading, error, attachments.length]);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAttachError(null);
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setAttachError(`You can attach up to ${MAX_ATTACHMENTS} images per message.`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setAttaching(true);
    try {
      const processed: ProcessedImage[] = [];
      for (const file of picked) {
        if (!isAcceptedImage(file)) {
          setAttachError('Only JPG, PNG, or WEBP images are supported.');
          continue;
        }
        processed.push(await processImage(file));
      }
      if (processed.length) setAttachments((prev) => [...prev, ...processed]);
      if (files.length > room) {
        setAttachError(`Only ${MAX_ATTACHMENTS} images per message; extra files were skipped.`);
      }
    } catch {
      setAttachError('Could not process one of those images.');
    } finally {
      setAttaching(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  const canSend = !loading && !attaching && (draft.trim().length > 0 || attachments.length > 0);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    onSend(draft, attachments);
    setDraft('');
    setAttachments([]);
    setAttachError(null);
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
        {turns.map((turn, i) => {
          const time = (
            <div className={`mt-1 text-[11px] text-slate-500 ${turn.role === 'user' ? 'text-right' : 'text-left'}`}>
              {formatTime(turn.ts)}
            </div>
          );

          // First turn: show only the user's photo thumbnail (the injected
          // analysis prompt text and the reference image stay hidden).
          if (i === 0) {
            return (
              <div key={i}>
                <div className="flex justify-end">
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
                {time}
              </div>
            );
          }

          if (turn.role === 'assistant') {
            const text = typeof turn.content === 'string' ? turn.content : '';
            return (
              <div key={i}>
                <ChatBubble role="assistant">
                  <Markdown>{text}</Markdown>
                </ChatBubble>
                {time}
              </div>
            );
          }

          // Follow-up user turn: render any attached images + optional text.
          const images = Array.isArray(turn.content)
            ? turn.content.filter((b) => b.type === 'image')
            : [];
          const text =
            typeof turn.content === 'string'
              ? turn.content
              : turn.content.find((b) => b.type === 'text')?.text ?? '';

          return (
            <div key={i}>
              {images.length > 0 && (
                <div className="mb-1 flex flex-wrap justify-end gap-2">
                  {images.map((img, k) => (
                    <img
                      key={k}
                      src={imageBlockToDataUrl(img)}
                      alt="Photo you attached"
                      className="h-28 w-28 rounded-xl border border-ink-700 object-cover"
                    />
                  ))}
                </div>
              )}
              {text && (
                <ChatBubble role="user" preWrap>
                  {text}
                </ChatBubble>
              )}
              {time}
            </div>
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

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              <img
                src={a.previewUrl}
                alt={`Attachment ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-ink-700 object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                aria-label={`Remove attachment ${i + 1}`}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink-700 text-xs text-slate-200 hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {attachError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {attachError}
        </p>
      )}

      <form onSubmit={submit} className="mt-3 flex shrink-0 items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => void addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={attaching || attachments.length >= MAX_ATTACHMENTS}
          aria-label="Attach a photo"
          title="Attach a photo"
          className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-slate-300 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a1.5 1.5 0 01-2.12-2.12l7.78-7.78" />
          </svg>
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Ask a follow-up question
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="Ask a follow-up, or attach a progress photo…"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="h-[2.75rem] shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
