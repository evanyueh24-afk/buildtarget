import { useState } from 'react';
import type { Archetype } from './archetypes';
import type { ApiMessage, ProcessedImage } from './types';
import { ArchetypeGrid } from './components/ArchetypeGrid';
import { UploadScreen } from './components/UploadScreen';
import { ChatView } from './components/ChatView';
import { sendChat } from './lib/api';
import { buildAnalysisMessage } from './lib/prompt';

type Step = 'select' | 'upload' | 'chat';

export default function App() {
  const [step, setStep] = useState<Step>('select');
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  // Image is held in React state (memory) only — never persisted anywhere.
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runChat(history: ApiMessage[]) {
    setError(null);
    setLoading(true);
    try {
      const text = await sendChat(history);
      setMessages([...history, { role: 'assistant', content: text }]);
    } catch (e) {
      // Keep the conversation intact so the user can retry the same turn.
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(a: Archetype) {
    setArchetype(a);
    setStep('upload');
  }

  function handleImageReady(img: ProcessedImage) {
    if (!archetype) return;
    setImage(img);
    const first = buildAnalysisMessage(archetype, img);
    setMessages([first]);
    setStep('chat');
    void runChat([first]);
  }

  function handleSend(text: string) {
    const next: ApiMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    void runChat(next);
  }

  function handleRetry() {
    // `messages` already ends with the user turn that failed; resend it.
    void runChat(messages);
  }

  function reset() {
    setStep('select');
    setArchetype(null);
    setImage(null);
    setMessages([]);
    setLoading(false);
    setError(null);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-ink-800 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-slate-100">BuildTarget</span>
          <span className="hidden text-xs text-slate-500 sm:inline">train toward a physique</span>
        </div>
        {step !== 'select' && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-ink-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-accent hover:text-accent"
          >
            Start over
          </button>
        )}
      </header>

      <main className="min-h-0 flex-1">
        {step === 'select' && (
          <div className="h-full overflow-y-auto px-4 py-8">
            <ArchetypeGrid selectedKey={archetype?.key ?? null} onSelect={handleSelect} />
          </div>
        )}

        {step === 'upload' && archetype && (
          <div className="h-full overflow-y-auto px-4 py-8">
            <UploadScreen
              archetype={archetype}
              onChangeArchetype={() => setStep('select')}
              onImageReady={handleImageReady}
            />
          </div>
        )}

        {step === 'chat' && archetype && image && (
          <div className="h-full px-4 py-4">
            <ChatView
              archetype={archetype}
              previewUrl={image.previewUrl}
              messages={messages}
              loading={loading}
              error={error}
              onSend={handleSend}
              onRetry={handleRetry}
            />
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-ink-800 px-4 py-3 text-center text-xs text-slate-500">
        BuildTarget gives general training information, not medical or fitness advice. Consult a
        qualified professional before starting a new training program.
      </footer>
    </div>
  );
}
