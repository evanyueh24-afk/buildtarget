import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ProcessedImage, Turn } from '../types';
import { ACCEPTED_TYPES, isAcceptedImage, processImage } from '../lib/image';
import { imageBlockToDataUrl } from '../lib/message';
import { ChatBubble } from './ChatBubble';
import { Markdown } from './Markdown';
import { TypingIndicator } from './TypingIndicator';
import { IntakeForm } from './IntakeForm';

const MAX_ATTACHMENTS = 4;

// Quick-start chips that surface the wider (but still bounded) scope so users
// discover it rather than guessing. Shown after the first analysis, until the
// user sends their first follow-up.
const SUGGESTIONS = ['我的恢复情况如何？', '有需要规避的伤病吗？', '训练前后应该怎么吃？'];

// Sent when the user taps the progress CTA. Deliberately a text roadmap grounded
// in training outcomes — NOT an image or a prediction of what the person will
// look like (see the note in the summary / system prompt).
const PROGRESS_PROMPT =
  '请给我一个朝这个体型努力的现实进度路线图：在坚持、科学的训练下，大约 3、6、12 个月分别能看到哪些训练变化和阶段性成果。请聚焦于力量、肌肉发展和比例，并如实说明每个阶段实际可以达到的程度。';

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
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: 'numeric', minute: '2-digit' });
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
  const [intakeOpen, setIntakeOpen] = useState(false);
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
      setAttachError(`每条消息最多可附带 ${MAX_ATTACHMENTS} 张图片。`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setAttaching(true);
    try {
      const processed: ProcessedImage[] = [];
      for (const file of picked) {
        if (!isAcceptedImage(file)) {
          setAttachError('仅支持 JPG、PNG 或 WEBP 图片。');
          continue;
        }
        processed.push(await processImage(file));
      }
      if (processed.length) setAttachments((prev) => [...prev, ...processed]);
      if (files.length > room) {
        setAttachError(`每条消息最多 ${MAX_ATTACHMENTS} 张图片，多余的已跳过。`);
      }
    } catch {
      setAttachError('无法处理其中某张图片。');
    } finally {
      setAttaching(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  const canSend = !loading && !attaching && (draft.trim().length > 0 || attachments.length > 0);

  // Show suggestion chips once the first analysis has arrived and before the
  // user has asked anything of their own.
  const hasAssistantReply = turns.some((t) => t.role === 'assistant');
  const hasUserFollowUp = turns.slice(1).some((t) => t.role === 'user');
  const showSuggestions = !loading && hasAssistantReply && !hasUserFollowUp;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    onSend(draft, attachments);
    setDraft('');
    setAttachments([]);
    setAttachError(null);
  }

  return (
    <section aria-label="教练对话" className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <div className="mb-3 shrink-0 text-sm text-slate-400">
        目标体型：<span className="font-semibold text-slate-100">{archetype.label}</span>
        <span className="mx-1 text-slate-600">·</span>
        <span className="font-semibold text-slate-100">{genderLabel(gender)}</span>
      </div>

      <div
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-ink-800 bg-ink-900 p-4"
        role="log"
        aria-live="polite"
        aria-label="消息"
      >
        {turns.map((turn, i) => {
          const time = (
            <div className={`mt-1 text-[11px] text-slate-400 ${turn.role === 'user' ? 'text-right' : 'text-left'}`}>
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
                      alt="你上传用于分析的照片"
                      className="rounded-2xl rounded-br-sm border border-ink-700"
                    />
                    <figcaption className="mt-1 text-right text-xs text-slate-500">
                      与「{archetype.label}」对比
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
                      alt="你附带的照片"
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
                重试
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Goal card: the target build (honest reference, not a doctored photo of
          the user) + a roadmap CTA. Shown after the first analysis. */}
      {showSuggestions && archetype.image && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3">
          <img
            src={archetype.image}
            alt={`「${archetype.label}」体型参考`}
            className="h-16 w-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">你想要练成的身型</p>
            <p className="truncate text-sm font-semibold text-slate-100">{archetype.label}</p>
          </div>
          <button
            type="button"
            onClick={() => onSend(PROGRESS_PROMPT, [])}
            disabled={loading}
            className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            查看你的进度预测
          </button>
        </div>
      )}

      {/* Quick-start suggestion chips + "Add your details" intake */}
      {showSuggestions && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="推荐问题">
          <button
            type="button"
            onClick={() => setIntakeOpen(true)}
            className="rounded-full border border-accent/60 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-ink-800"
          >
＋ 补充你的资料
          </button>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s, [])}
              className="rounded-full border border-ink-700 bg-ink-850 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-accent hover:text-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {intakeOpen && (
        <IntakeForm
          onClose={() => setIntakeOpen(false)}
          onSubmit={(message) => {
            setIntakeOpen(false);
            onSend(message, []);
          }}
        />
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              <img
                src={a.previewUrl}
                alt={`附件 ${i + 1}`}
                className="h-16 w-16 rounded-lg border border-ink-700 object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                aria-label={`移除附件 ${i + 1}`}
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
          aria-label="添加照片"
          title="添加照片"
          className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-850 text-slate-300 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a1.5 1.5 0 01-2.12-2.12l7.78-7.78" />
          </svg>
        </button>
        <label htmlFor="chat-input" className="sr-only">
          输入后续问题
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="输入后续问题，或附上一张进展照片…"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="h-[2.75rem] shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          发送
        </button>
      </form>
    </section>
  );
}
