import { useState } from 'react';
import { ARCHETYPES, type Archetype, type Gender } from './data/archetypes';
import type { ContentBlock, ProcessedImage, Turn } from './types';
import { AgeGate } from './components/AgeGate';
import { GenderSelect } from './components/GenderSelect';
import { ArchetypeGrid } from './components/ArchetypeGrid';
import { UploadScreen } from './components/UploadScreen';
import { ChatView } from './components/ChatView';
import { LegalOverlay, type LegalDoc } from './components/Legal';
import { processReferenceImage } from './lib/image';
import { imageBlockOf } from './lib/message';
import { sendChat } from './lib/api';
import { buildAnalysisMessage } from './lib/prompt';

type Step = 'age' | 'gender' | 'select' | 'upload' | 'chat';

const AGE_OK_KEY = 'bt_age_ok';

function ageConfirmed(): boolean {
  try {
    return localStorage.getItem(AGE_OK_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  // Skip the age gate if it was confirmed on a previous visit.
  const [step, setStep] = useState<Step>(() => (ageConfirmed() ? 'gender' : 'age'));
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  // Image is held in React state (memory) only — never persisted anywhere.
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runChat(history: Turn[]) {
    setError(null);
    setLoading(true);
    try {
      // Strip display-only metadata before sending to the proxy.
      const text = await sendChat(history.map(({ role, content }) => ({ role, content })));
      setTurns([...history, { role: 'assistant', content: text, ts: Date.now() }]);
    } catch (e) {
      // Keep the conversation intact so the user can retry the same turn.
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleAgeContinue() {
    try {
      localStorage.setItem(AGE_OK_KEY, '1');
    } catch {
      // Storage may be unavailable (private mode); proceed for this session anyway.
    }
    setStep('gender');
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
    // user's photo, so the AI can compare the two builds visually.
    let reference: ProcessedImage | undefined;
    if (archetype.image) {
      try {
        reference = await processReferenceImage(archetype.image);
      } catch {
        reference = undefined;
      }
    }
    const first = buildAnalysisMessage(gender, archetype, img, reference);
    const firstTurn: Turn = { ...first, ts: Date.now() };
    setTurns([firstTurn]);
    void runChat([firstTurn]);
  }

  function handleSend(text: string, attachments: ProcessedImage[]) {
    const trimmed = text.trim();
    let content: string | ContentBlock[];
    if (attachments.length > 0) {
      const blocks: ContentBlock[] = attachments.map(imageBlockOf);
      if (trimmed) blocks.push({ type: 'text', text: trimmed });
      content = blocks;
    } else {
      content = trimmed;
    }
    const next: Turn[] = [...turns, { role: 'user', content, ts: Date.now() }];
    setTurns(next);
    void runChat(next);
  }

  function handleRetry() {
    // `turns` already ends with the user turn that failed; resend it.
    void runChat(turns);
  }

  function reset() {
    setStep('gender');
    setGender(null);
    setArchetype(null);
    setImage(null);
    setTurns([]);
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
        {step !== 'gender' && step !== 'age' && (
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
        {step === 'age' && (
          <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-8">
            <AgeGate onContinue={handleAgeContinue} />
          </div>
        )}

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
              turns={turns}
              loading={loading}
              error={error}
              onSend={handleSend}
              onRetry={handleRetry}
            />
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-ink-800 px-4 py-3 text-center text-xs text-slate-500">
        <p>
          BuildTarget gives general training information, not medical or fitness advice. Consult a
          qualified professional before starting a new training program.
        </p>
        <p className="mt-1">
          <button
            type="button"
            onClick={() => setLegal('privacy')}
            className="font-medium text-slate-400 underline hover:text-accent"
          >
            Privacy Policy
          </button>
          <span className="mx-2 text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setLegal('terms')}
            className="font-medium text-slate-400 underline hover:text-accent"
          >
            Terms of Service
          </button>
        </p>
      </footer>

      {legal && <LegalOverlay doc={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}
