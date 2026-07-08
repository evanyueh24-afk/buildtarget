import { ARCHETYPES, type Archetype } from '../archetypes';

interface Props {
  selectedKey: string | null;
  onSelect: (archetype: Archetype) => void;
}

export function ArchetypeGrid({ selectedKey, onSelect }: Props) {
  return (
    <section aria-labelledby="archetype-heading" className="mx-auto w-full max-w-3xl">
      <h2 id="archetype-heading" className="mb-1 text-2xl font-semibold tracking-tight">
        Pick a target physique
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        Choose the athletic build you want to train toward. You&rsquo;ll upload a photo next.
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {ARCHETYPES.map((a) => {
          const selected = a.key === selectedKey;
          return (
            <li key={a.key}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                aria-pressed={selected}
                className={[
                  'flex h-full w-full flex-col rounded-xl border p-4 text-left transition',
                  'hover:border-accent hover:bg-ink-800',
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-ink-700 bg-ink-850',
                ].join(' ')}
              >
                <span className="text-base font-semibold text-slate-100">{a.label}</span>
                <span className="mt-1 text-xs leading-snug text-slate-400">{a.teaser}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
