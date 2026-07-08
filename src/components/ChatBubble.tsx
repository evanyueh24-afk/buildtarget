import type { ReactNode } from 'react';

interface Props {
  role: 'user' | 'assistant';
  children: ReactNode;
}

export function ChatBubble({ role, children }: Props) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]',
          isUser
            ? 'rounded-br-sm bg-accent text-white'
            : 'rounded-bl-sm bg-ink-800 text-slate-100',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
