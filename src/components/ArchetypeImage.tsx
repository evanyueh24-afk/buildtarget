import type { Gender } from '../data/archetypes';

interface Props {
  gender: Gender;
  label: string;
  src?: string;
}

// Shoulder / hip proportions differ by training focus so male and female
// placeholders read distinctly. These are abstract silhouettes — deliberately
// NOT depictions of any real person (see the `image` field docs in
// data/archetypes.ts for using licensed real photos instead).
const SHAPE: Record<Gender, { shoulder: number; hip: number }> = {
  male: { shoulder: 72, hip: 46 },
  female: { shoulder: 54, hip: 62 },
};

export function ArchetypeImage({ gender, label, src }: Props) {
  if (src) {
    return (
      <div className="mb-3 overflow-hidden rounded-lg bg-ink-800">
        <img
          src={src}
          alt={`「${label}」体型参考`}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover"
        />
      </div>
    );
  }

  const { shoulder, hip } = SHAPE[gender];
  const cx = 60;
  const armX = cx - shoulder / 2 - 6;

  return (
    <div className="mb-3 overflow-hidden rounded-lg bg-gradient-to-b from-ink-700 to-ink-850">
      <svg
        viewBox="0 0 120 170"
        role="img"
        aria-label={`「${label}」体型剪影（占位图）`}
        className="mx-auto block aspect-[4/5] w-full max-h-32 py-2 text-accent/45"
      >
        <g fill="currentColor">
          {/* head */}
          <circle cx={cx} cy={26} r={14} />
          {/* torso: shoulders → hips */}
          <path
            d={`M ${cx - shoulder / 2} 48
                L ${cx + shoulder / 2} 48
                L ${cx + hip / 2} 110
                L ${cx - hip / 2} 110 Z`}
          />
          {/* arms */}
          <rect x={armX} y={50} width={12} height={62} rx={6} />
          <rect x={120 - armX - 12} y={50} width={12} height={62} rx={6} />
          {/* legs */}
          <rect x={cx - 20} y={108} width={18} height={58} rx={9} />
          <rect x={cx + 2} y={108} width={18} height={58} rx={9} />
        </g>
      </svg>
    </div>
  );
}
