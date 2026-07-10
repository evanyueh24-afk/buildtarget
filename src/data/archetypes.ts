// Archetype data, keyed by training focus (gender). Adding or changing an
// archetype should require editing ONLY this file — the grid, prompt injection,
// and chat all read from it generically.
//
// - `label`   — shown on the card and in the chat header.
// - `teaser`  — the short (5-8 word) line shown on the card. UI only.
// - `athlete` — a widely-known reference athlete for that build, shown on the
//   card as "think <name>". UI only (never sent to the AI).
// - `description` — the detailed line injected into the AI prompt. Never shown
//   in the UI. Keep it specific enough to produce a meaningfully different
//   response per archetype.
//
// Tone rule for every entry, both sets, without exception: describe athletic
// build, muscle development, proportion, and training focus only — never
// weight, body fat, or appearance/attractiveness.

export type Gender = 'male' | 'female';

export interface Archetype {
  key: string;
  label: string;
  teaser: string;
  athlete: string;
  description: string;
  /**
   * Optional reference image (URL or imported asset path) shown on the card.
   * Left unset for every archetype today, so cards render a rights-clean,
   * on-brand silhouette placeholder instead. To use a real photo you have the
   * rights to, set this to its URL/path — the card renders it automatically,
   * no other change needed. Do NOT point this at scraped/unlicensed athlete
   * photos: it's a deployed product and those carry copyright + likeness risk.
   */
  image?: string;
}

export const GENDERS: readonly { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export function genderLabel(gender: Gender): string {
  return gender === 'male' ? 'Male' : 'Female';
}

const MALE: readonly Archetype[] = [
  {
    key: 'swimmer',
    label: 'Swimmer',
    teaser: 'Broad shoulders, tapered waist, lean',
    athlete: 'Adam Peaty',
    description:
      'broad shoulders and lats, tapered waist, long lean muscle, strong upper back and core, low bulk in legs relative to upper body',
  },
  {
    key: 'sprinter',
    label: 'Sprinter',
    teaser: 'Powerful legs, lean and explosive',
    athlete: 'Usain Bolt',
    description:
      'powerful glutes and hamstrings, muscular but not bulky quads, lean upper body, strong core, athletic low body fat',
  },
  {
    key: 'gymnast',
    label: 'Gymnast',
    teaser: 'Dense, compact, exceptional relative strength',
    athlete: 'Kohei Uchimura',
    description:
      'dense, compact muscle everywhere, exceptional relative strength, strong forearms and shoulders, very low body fat, minimal bulk',
  },
  {
    key: 'climber',
    label: 'Climber',
    teaser: 'Wiry, light, strong grip and back',
    athlete: 'Alex Honnold',
    description:
      'lean and light overall, strong forearms and back, wiry muscle, minimal excess mass anywhere, strong grip and core',
  },
  {
    key: 'bodybuilder',
    label: 'Classic bodybuilder',
    teaser: 'Maximum muscle mass and symmetry',
    athlete: 'Chris Bumstead',
    description:
      'maximum overall muscle mass and symmetry across all muscle groups, wide shoulders, small waist, very developed arms and legs',
  },
  {
    key: 'powerlifter',
    label: 'Powerlifter',
    teaser: 'Thick, dense, built for raw strength',
    athlete: 'Eddie Hall',
    description:
      'dense functional mass through the posterior chain, thick back and legs, strong midsection, built for raw strength over aesthetics',
  },
  {
    key: 'martial-artist',
    label: 'Martial artist',
    teaser: 'Lean, explosive, agile, functional',
    athlete: 'Conor McGregor',
    description:
      'lean, explosive muscle, strong hips and core rotation, conditioned and agile, functional strength over size',
  },
  {
    key: 'rower',
    label: 'Rower',
    teaser: 'Strong legs and back, high engine',
    athlete: 'Steve Redgrave',
    description:
      'very strong and thick legs, powerful back and glutes, high overall muscle mass with strong cardiovascular conditioning',
  },
  {
    key: 'football-rugby',
    label: 'Football/Rugby',
    teaser: 'Thick, powerful, built for contact',
    athlete: 'Derrick Henry',
    description:
      'thick, powerful frame, strong legs and glutes, dense muscular back and shoulders, built for contact and explosive power, higher overall mass than most other archetypes',
  },
] as const;

const FEMALE: readonly Archetype[] = [
  {
    key: 'swimmer',
    label: 'Swimmer',
    teaser: 'Strong back and lats, lean, powerful legs',
    athlete: 'Katie Ledecky',
    description:
      'broad shoulders and lats relative to frame, strong core and back, lean, powerful legs',
  },
  {
    key: 'diver',
    label: 'Diver',
    teaser: 'Strong core and shoulders, powerful legs',
    athlete: 'Chen Ruolin',
    description:
      'strong core and shoulders, lean powerful legs, excellent body control and balance',
  },
  {
    key: 'ice-skater',
    label: 'Ice skater',
    teaser: 'Strong glutes and quads, balanced control',
    athlete: 'Michelle Kwan',
    description:
      'strong glutes and quads, excellent balance and core control, lean powerful lower body',
  },
  {
    key: 'pilates-barre',
    label: 'Pilates/Barre',
    teaser: 'Strong core, control, functional strength',
    athlete: 'Nadia Comăneci',
    description:
      'strong core and stabilizer muscles, excellent posture and control, lean functional strength',
  },
  {
    key: 'functional-fitness',
    label: 'Gym/Functional fitness',
    teaser: 'Balanced full-body strength, high capacity',
    athlete: 'Tia-Clair Toomey',
    description:
      'balanced full-body muscle development, high work capacity, strong posterior chain',
  },
  {
    key: 'dancer',
    label: 'Dancer',
    teaser: 'Long lean muscle, core control, posture',
    athlete: 'Misty Copeland',
    description:
      'long lean muscle, exceptional core control and balance, strong legs and posture',
  },
  {
    key: 'volleyball',
    label: 'Volleyball',
    teaser: 'Strong shoulders, powerful explosive legs',
    athlete: 'Kerri Walsh Jennings',
    description:
      'strong shoulders and back, powerful legs, athletic explosive build',
  },
  {
    key: 'sprinter-track',
    label: 'Sprinter/Track',
    teaser: 'Powerful glutes and hamstrings, explosive',
    athlete: 'Allyson Felix',
    description:
      'strong glutes and hamstrings, athletic lean build, powerful explosive legs, strong core',
  },
  {
    key: 'martial-artist-boxer',
    label: 'Martial artist/Boxer',
    teaser: 'Lean, explosive, agile, conditioned',
    athlete: 'Ronda Rousey',
    description:
      'lean, explosive, strong hips and core rotation, agile and conditioned',
  },
] as const;

export const ARCHETYPES: Record<Gender, readonly Archetype[]> = {
  male: MALE,
  female: FEMALE,
};
