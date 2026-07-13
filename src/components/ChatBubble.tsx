import type { ReactNode } from 'react';

interface Props {
  role: 'user' | 'assistant';
  /** Preserve newlines/whitespace (for plain user text). Markdown sets its own. */
  preWrap?: boolean;
  children: ReactNode;
}

export function ChatBubble({ role, preWrap = false, children }: Props) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'bubble-in max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]',
          preWrap ? 'whitespace-pre-wrap' : '',
          isUser ? 'rounded-br-sm bg-accent text-white' : 'rounded-bl-sm bg-ink-800 text-slate-100',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
