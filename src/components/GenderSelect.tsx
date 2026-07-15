import { GENDERS, type Gender } from '../data/archetypes';

interface Props {
  selected: Gender | null;
  onSelect: (gender: Gender) => void;
}

const ICONS: Record<Gender, string> = { male: '♂', female: '♀' };

export function GenderSelect({ selected, onSelect }: Props) {
  return (
    <section aria-labelledby="gender-heading" className="mx-auto w-full max-w-xl py-6 sm:py-12">
      <h1
        id="gender-heading"
        className="text-balance text-4xl font-bold leading-[1.15] tracking-tight text-slate-50 sm:text-6xl"
      >
        朝理想体型训练。
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
        选择你的训练方向即可开始。
      </p>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:mt-20">
        {GENDERS.map((g) => {
          const isSelected = g.value === selected;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => onSelect(g.value)}
              aria-pressed={isSelected}
              className={[
                'group flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-14 transition',
                'hover:border-accent hover:bg-ink-800',
                isSelected ? 'border-accent bg-accent-soft' : 'border-ink-700 bg-ink-850',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={`text-4xl transition ${isSelected ? 'text-accent' : 'text-slate-400 group-hover:text-accent'}`}
              >
                {ICONS[g.value]}
              </span>
              <span className="text-lg font-semibold text-slate-50">{g.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
