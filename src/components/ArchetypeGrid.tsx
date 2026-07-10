import { type Archetype, type Gender, genderLabel } from '../data/archetypes';

interface Props {
  archetypes: readonly Archetype[];
  gender: Gender;
  selectedKey: string | null;
  onSelect: (archetype: Archetype) => void;
  onChangeGender: () => void;
}

export function ArchetypeGrid({
  archetypes,
  gender,
  selectedKey,
  onSelect,
  onChangeGender,
}: Props) {
  return (
    <section aria-labelledby="archetype-heading" className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Training focus: <span className="font-semibold text-slate-100">{genderLabel(gender)}</span>
        </p>
        <button
          type="button"
          onClick={onChangeGender}
          className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
        >
          Change
        </button>
      </div>

      <h2 id="archetype-heading" className="mb-1 text-2xl font-semibold tracking-tight">
        Pick a target physique
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        Choose the athletic build you want to train toward. You&rsquo;ll upload a photo next.
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {archetypes.map((a) => {
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
                  selected ? 'border-accent bg-accent-soft' : 'border-ink-700 bg-ink-850',
                ].join(' ')}
              >
                <span className="text-base font-semibold text-slate-100">{a.label}</span>
                <span className="mt-1 text-xs leading-snug text-slate-400">{a.teaser}</span>
                <span className="mt-2 text-xs font-medium text-accent">think {a.athlete}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
