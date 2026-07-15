import { useEffect, useRef, useState, type FormEvent } from 'react';

interface Props {
  onSubmit: (detailsMessage: string) => void;
  onClose: () => void;
}

interface Fields {
  age: string;
  height: string;
  weight: string;
  occupation: string;
  activity: string;
  sports: string;
  experience: string;
  diet: string;
}

const EMPTY: Fields = {
  age: '',
  height: '',
  weight: '',
  occupation: '',
  activity: '',
  sports: '',
  experience: '',
  diet: '',
};

const LABELS: Record<keyof Fields, string> = {
  age: 'Age',
  height: 'Height',
  weight: 'Weight',
  occupation: 'Occupation',
  activity: 'Activity level',
  sports: 'Sports background',
  experience: 'Training experience',
  diet: 'Diet',
};

/** Optional intake form (accessible dialog). Collects context that sharpens the
 *  training analysis. Only the fields the user fills in are sent. */
export function IntakeForm({ onSubmit, onClose }: Props) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const panelRef = useRef<HTMLFormElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const invoker = useRef<Element | null>(null);

  useEffect(() => {
    invoker.current = document.activeElement;
    firstRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement;
        if (!panelRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (invoker.current instanceof HTMLElement) invoker.current.focus();
    };
  }, [onClose]);

  function set<K extends keyof Fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const provided = (Object.keys(fields) as (keyof Fields)[])
      .filter((k) => fields[k].trim().length > 0)
      .map((k) => `- ${LABELS[k]}: ${fields[k].trim()}`);
    if (provided.length === 0) {
      onClose();
      return;
    }
    const message = `Here are some details about me to help refine the analysis:\n${provided.join(
      '\n',
    )}\n\nPlease factor these into your training recommendations and general guidance.`;
    onSubmit(message);
  }

  const textInput = (key: keyof Fields, placeholder: string, ref?: typeof firstRef) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{LABELS[key]}</span>
      <input
        ref={ref}
        type="text"
        value={fields[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
      />
    </label>
  );

  const selectInput = (key: keyof Fields, options: string[]) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{LABELS[key]}</span>
      <select
        value={fields[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
      >
        <option value="">Prefer not to say</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        ref={panelRef}
        onSubmit={submit}
        className="my-auto w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6"
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <h2 id="intake-title" className="text-xl font-semibold tracking-tight text-slate-50">
            Add your details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ink-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-accent hover:text-accent"
          >
            Cancel
          </button>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          All optional — share what you like and it&rsquo;ll sharpen the training guidance.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {textInput('age', 'e.g. 27', firstRef)}
          {textInput('occupation', 'e.g. desk job / nurse')}
          {textInput('height', "e.g. 180 cm or 5'11\"")}
          {textInput('weight', 'e.g. 75 kg or 165 lb')}
          {selectInput('activity', ['Sedentary', 'Lightly active', 'Active', 'Very active'])}
          {selectInput('experience', [
            'Beginner (< 1 yr)',
            'Intermediate (1-3 yr)',
            'Advanced (3+ yr)',
          ])}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          {textInput('sports', 'e.g. played rugby, run 5k weekly')}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Diet</span>
            <textarea
              value={fields.diet}
              onChange={(e) => set('diet', e.target.value)}
              rows={2}
              placeholder="How you currently eat, any preferences (general — no need for exact numbers)"
              className="w-full resize-none rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Use these details
          </button>
        </div>
      </form>
    </div>
  );
}
