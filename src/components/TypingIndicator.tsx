export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-ink-800 px-4 py-3">
        <span className="sr-only">The coach is thinking…</span>
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
