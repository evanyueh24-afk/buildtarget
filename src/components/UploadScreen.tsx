import { useRef, useState, type DragEvent } from 'react';
import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import { ACCEPTED_TYPES, isAcceptedImage, processImage } from '../lib/image';
import type { ProcessedImage } from '../types';

interface Props {
  archetype: Archetype;
  gender: Gender;
  onChangeArchetype: () => void;
  onChangeGender: () => void;
  onImageReady: (image: ProcessedImage) => void;
}

export function UploadScreen({
  archetype,
  gender,
  onChangeArchetype,
  onChangeGender,
  onImageReady,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!isAcceptedImage(file)) {
      setError('That file type isn’t supported. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setWorking(true);
    try {
      const image = await processImage(file);
      onImageReady(image);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process that image.');
      setWorking(false);
    }
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <section aria-labelledby="upload-heading" className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-400">
          Target: <span className="font-semibold text-slate-100">{archetype.label}</span>
          <span className="mx-1 text-slate-600">·</span>
          <span className="font-semibold text-slate-100">{genderLabel(gender)}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onChangeArchetype}
            className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
          >
            Change archetype
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            type="button"
            onClick={onChangeGender}
            className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
          >
            Change gender
          </button>
        </div>
      </div>

      <h2 id="upload-heading" className="mb-1 text-2xl font-semibold tracking-tight">
        Upload a photo to start
      </h2>
      <p className="mb-5 text-sm text-slate-400">
        Full-body, good lighting, form-fitting or no shirt works best for an accurate comparison.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={working}
        aria-label="Upload a photo of yourself: drag and drop, or activate to browse. Accepts JPG, PNG, or WEBP."
        className={[
          'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition',
          dragging ? 'border-accent bg-accent-soft' : 'border-ink-600 bg-ink-850 hover:border-accent',
          working ? 'cursor-wait opacity-70' : 'cursor-pointer',
        ].join(' ')}
      >
        <span aria-hidden="true" className="text-3xl">
          {working ? '⏳' : '📷'}
        </span>
        <span className="text-base font-medium text-slate-100">
          {working ? 'Preparing your photo…' : 'Drag & drop or tap to choose a photo'}
        </span>
        <span className="text-xs text-slate-500">JPG, PNG, or WEBP</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        // Deliberately NOT using `capture` — a full-body photo is usually an
        // existing shot or a mirror/timer photo, so we let the native mobile
        // picker offer both "Camera" and "Photo Library" rather than forcing
        // the live camera. See README "Assumptions and deviations".
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Your photo is sent to the AI for analysis and isn&rsquo;t stored on our servers or in your
        browser. Refreshing the page will require re-uploading it.
      </p>
    </section>
  );
}
