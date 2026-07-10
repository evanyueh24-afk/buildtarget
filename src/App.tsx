import { useState } from 'react';
import { ARCHETYPES, type Archetype, type Gender } from './data/archetypes';
import type { ApiMessage, ProcessedImage } from './types';
import { GenderSelect } from './components/GenderSelect';
import { ArchetypeGrid } from './components/ArchetypeGrid';
import { UploadScreen } from './components/UploadScreen';
import { ChatView } from './components/ChatView';
import { processReferenceImage } from './lib/image';
import { sendChat } from './lib/api';
import { buildAnalysisMessage } from './lib/prompt';

type Step = 'gender' | 'select' | 'upload' | 'chat';

export default function App() {
  const [step, setStep] = useState<Step>('gender');
  const [gender, setGender] = useState<Gender | null>(null);
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

  function handleSelectGender(g: Gender) {
    setGender(g);
    // A previously chosen archetype belongs to the old gender's set — clear it.
    setArchetype(null);
    setStep('select');
  }

  function handleSelectArchetype(a: Archetype) {
    setArchetype(a);
    setStep('upload');
  }

  async function handleImageReady(img: ProcessedImage) {
    if (!gender || !archetype) return;
    setImage(img);
    setStep('chat');
    setError(null);
    setLoading(true);
    // Compress the archetype's reference photo (if any) to send alongside the
    // user's photo, so the AI can compare the two builds visually. If it fails
    // to process, we still proceed with the user's photo + text description.
    let reference: ProcessedImage | undefined;
    if (archetype.image) {
      try {
        reference = await processReferenceImage(archetype.image);
      } catch {
        reference = undefined;
      }
    }
    const first = buildAnalysisMessage(gender, archetype, img, reference);
    setMessages([first]);
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
    setStep('gender');
    setGender(null);
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
        {step !== 'gender' && (
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
        {step === 'gender' && (
          <div className="h-full overflow-y-auto px-4 py-8">
            <GenderSelect selected={gender} onSelect={handleSelectGender} />
          </div>
        )}

        {step === 'select' && gender && (
          <div className="h-full overflow-y-auto px-4 py-8">
            <ArchetypeGrid
              archetypes={ARCHETYPES[gender]}
              gender={gender}
              selectedKey={archetype?.key ?? null}
              onSelect={handleSelectArchetype}
              onChangeGender={() => setStep('gender')}
            />
          </div>
        )}

        {step === 'upload' && gender && archetype && (
          <div className="h-full overflow-y-auto px-4 py-8">
            <UploadScreen
              archetype={archetype}
              gender={gender}
              onChangeArchetype={() => setStep('select')}
              onChangeGender={() => setStep('gender')}
              onImageReady={handleImageReady}
            />
          </div>
        )}

        {step === 'chat' && gender && archetype && image && (
          <div className="h-full px-4 py-4">
            <ChatView
              archetype={archetype}
              gender={gender}
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
