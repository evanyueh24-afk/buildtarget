import { GENDERS, type Gender } from '../data/archetypes';

interface Props {
  selected: Gender | null;
  onSelect: (gender: Gender) => void;
}

const ICONS: Record<Gender, string> = { male: '♂', female: '♀' };

export function GenderSelect({ selected, onSelect }: Props) {
  return (
    <section aria-labelledby="gender-heading" className="mx-auto w-full max-w-xl">
      <h2 id="gender-heading" className="mb-1 text-2xl font-semibold tracking-tight">
        Select your training focus
      </h2>
      <p className="mb-6 text-sm text-slate-400">
        This tailors the physique archetypes and the comparison to your build.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {GENDERS.map((g) => {
          const isSelected = g.value === selected;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => onSelect(g.value)}
              aria-pressed={isSelected}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 transition',
                'hover:border-accent hover:bg-ink-800',
                isSelected ? 'border-accent bg-accent-soft' : 'border-ink-700 bg-ink-850',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-4xl text-accent">
                {ICONS[g.value]}
              </span>
              <span className="text-lg font-semibold text-slate-100">{g.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
