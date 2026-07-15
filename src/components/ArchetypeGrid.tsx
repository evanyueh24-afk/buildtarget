import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import { ArchetypeImage } from './ArchetypeImage';

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
    <section aria-labelledby="archetype-heading" className="mx-auto w-full max-w-3xl py-4 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          训练方向 ·{' '}
          <span className="text-slate-300">{genderLabel(gender)}</span>
        </p>
        <button
          type="button"
          onClick={onChangeGender}
          className="rounded-md px-2 py-1 text-sm font-medium text-accent hover:text-accent-hover hover:underline"
        >
          更改
        </button>
      </div>

      <h2
        id="archetype-heading"
        className="text-balance text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl"
      >
        选择一个目标体型。
      </h2>
      <p className="mt-3 mb-10 text-base text-slate-400">你想要练成的身型。</p>

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
                  'flex h-full w-full flex-col rounded-xl border p-3 text-left transition',
                  'hover:border-accent hover:bg-ink-800',
                  selected ? 'border-accent bg-accent-soft' : 'border-ink-700 bg-ink-850',
                ].join(' ')}
              >
                <ArchetypeImage gender={gender} label={a.label} src={a.image} />
                <span className="text-base font-semibold text-slate-100">{a.label}</span>
                <span className="mt-1 text-xs leading-snug text-slate-400">{a.teaser}</span>
                <span className="mt-2 text-xs font-medium text-accent">参考：{a.athlete}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
