// Adding a new archetype should require editing ONLY this array. Every other
// part of the app (grid, prompt injection, chat) reads from it generically.
//
// - `label`   — shown on the card and in the chat header.
// - `teaser`  — the short (5-8 word) line shown on the card. UI only.
// - `description` — the detailed line injected into the AI prompt. Never shown
//   in the UI. Keep it specific enough to produce a meaningfully different
//   response per archetype.

export interface Archetype {
  key: string;
  label: string;
  teaser: string;
  description: string;
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    key: 'swimmer',
    label: 'Swimmer',
    teaser: 'Broad shoulders, tapered waist, lean',
    description:
      'broad shoulders and lats, tapered waist, long lean muscle, strong upper back and core, low bulk in legs relative to upper body',
  },
  {
    key: 'sprinter',
    label: 'Sprinter',
    teaser: 'Powerful legs, lean and explosive',
    description:
      'powerful glutes and hamstrings, muscular but not bulky quads, lean upper body, strong core, athletic low body fat',
  },
  {
    key: 'gymnast',
    label: 'Gymnast',
    teaser: 'Dense, compact, exceptional relative strength',
    description:
      'dense, compact muscle everywhere, exceptional relative strength, strong forearms and shoulders, very low body fat, minimal bulk',
  },
  {
    key: 'climber',
    label: 'Climber',
    teaser: 'Wiry, light, strong grip and back',
    description:
      'lean and light overall, strong forearms and back, wiry muscle, minimal excess mass anywhere, strong grip and core',
  },
  {
    key: 'bodybuilder',
    label: 'Classic bodybuilder',
    teaser: 'Maximum muscle mass and symmetry',
    description:
      'maximum overall muscle mass and symmetry across all muscle groups, wide shoulders, small waist, very developed arms and legs',
  },
  {
    key: 'powerlifter',
    label: 'Powerlifter',
    teaser: 'Thick, dense, built for raw strength',
    description:
      'dense functional mass through the posterior chain, thick back and legs, strong midsection, built for raw strength over aesthetics',
  },
  {
    key: 'martial-artist',
    label: 'Martial artist',
    teaser: 'Lean, explosive, agile, functional',
    description:
      'lean, explosive muscle, strong hips and core rotation, conditioned and agile, functional strength over size',
  },
  {
    key: 'rower',
    label: 'Rower',
    teaser: 'Strong legs and back, high engine',
    description:
      'very strong and thick legs, powerful back and glutes, high overall muscle mass with strong cardiovascular conditioning',
  },
] as const;
