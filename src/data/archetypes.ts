// Archetype data, keyed by training focus (gender). Adding or changing an
// archetype should require editing ONLY this file — the grid, prompt injection,
// and chat all read from it generically.
//
// - `label`   — shown on the card and in the chat header.
// - `teaser`  — the short line shown on the card. UI only.
// - `athlete` — a widely-known reference athlete for that build, shown on the
//   card as "参考：<name>". UI only (never sent to the AI).
// - `description` — the detailed line injected into the AI prompt. Never shown
//   in the UI. Keep it specific enough to produce a meaningfully different
//   response per archetype.
//
// Keys stay in English because they map to the reference image filenames
// (src/assets/archetypes/<gender>-<key>.<ext>). Only the display/prompt text is
// localized.

export type Gender = 'male' | 'female';

export interface Archetype {
  key: string;
  label: string;
  teaser: string;
  athlete: string;
  description: string;
  image?: string;
}

export const GENDERS: readonly { value: Gender; label: string }[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
] as const;

export function genderLabel(gender: Gender): string {
  return gender === 'male' ? '男性' : '女性';
}

const MALE: readonly Archetype[] = [
  {
    key: 'swimmer',
    label: '游泳运动员',
    teaser: '宽肩细腰，精瘦修长',
    athlete: '亚当·皮蒂',
    description:
      '宽肩阔背、腰部收窄、肌肉修长精瘦、上背和核心强壮、相对上半身腿部块头较小',
  },
  {
    key: 'sprinter',
    label: '短跑运动员',
    teaser: '强腿爆发，精瘦有力',
    athlete: '尤塞恩·博尔特',
    description:
      '强健的臀部和腘绳肌、发达但不臃肿的股四头肌、精瘦的上半身、强壮的核心、运动员般的低体脂',
  },
  {
    key: 'gymnast',
    label: '体操运动员',
    teaser: '紧实致密，相对力量出色',
    athlete: '内村航平',
    description:
      '全身肌肉紧实致密、出色的相对力量、前臂和肩部强壮、极低体脂、块头精练不臃肿',
  },
  {
    key: 'climber',
    label: '攀岩运动员',
    teaser: '精瘦轻盈，握力背部强',
    athlete: '亚历克斯·霍诺德',
    description:
      '整体精瘦轻盈、前臂和背部强壮、肌肉如线条般紧实、全身几乎没有多余体重、握力和核心强',
  },
  {
    key: 'bodybuilder',
    label: '古典健美运动员',
    teaser: '最大肌肉量与对称',
    athlete: '克里斯·邦斯特德',
    description:
      '各肌群整体肌肉量和对称性最大化、肩宽腰细、手臂和腿部非常发达',
  },
  {
    key: 'powerlifter',
    label: '力量举运动员',
    teaser: '厚实致密，原始力量',
    athlete: '埃迪·霍尔',
    description:
      '后链密实的功能性肌肉、厚实的背部和腿部、强壮的中段、为原始力量而非美观而生',
  },
  {
    key: 'martial-artist',
    label: '格斗运动员',
    teaser: '精瘦爆发，敏捷实用',
    athlete: '康纳·麦格雷戈',
    description:
      '精瘦而具爆发力的肌肉、强壮的髋部和核心旋转、体能好且敏捷、功能性力量优先于块头',
  },
  {
    key: 'rower',
    label: '赛艇运动员',
    teaser: '强腿强背，心肺出色',
    athlete: '史蒂夫·雷德格雷夫',
    description:
      '非常强壮厚实的腿部、强健的背部和臀部、整体肌肉量大且心肺耐力强',
  },
  {
    key: 'football-rugby',
    label: '橄榄球运动员',
    teaser: '厚实有力，为对抗而生',
    athlete: '德里克·亨利',
    description:
      '厚实而有力的身架、强壮的腿部和臀部、致密的背部和肩部肌肉、为对抗和爆发力而生、整体块头高于多数其他类型',
  },
] as const;

const FEMALE: readonly Archetype[] = [
  {
    key: 'swimmer',
    label: '游泳运动员',
    teaser: '背强精瘦，腿部有力',
    athlete: '凯蒂·莱德基',
    description: '相对身架宽阔的肩部和背阔肌、强壮的核心和背部、精瘦、腿部有力',
  },
  {
    key: 'diver',
    label: '跳水运动员',
    teaser: '核心肩强，腿部有力',
    athlete: '陈若琳',
    description: '强壮的核心和肩部、精瘦而有力的腿部、出色的身体控制与平衡',
  },
  {
    key: 'ice-skater',
    label: '花样滑冰运动员',
    teaser: '臀腿强壮，平衡出色',
    athlete: '关颖珊',
    description: '强壮的臀部和股四头肌、出色的平衡与核心控制、精瘦有力的下半身',
  },
  {
    key: 'pilates-barre',
    label: '普拉提／把杆',
    teaser: '核心稳定，功能力量',
    athlete: '纳迪娅·科马内奇',
    description: '强壮的核心和稳定肌群、优秀的体态与控制、精瘦的功能性力量',
  },
  {
    key: 'functional-fitness',
    label: '健身／功能训练',
    teaser: '全身均衡，训练容量高',
    athlete: '蒂亚-克莱尔·图米',
    description: '全身均衡的肌肉发展、高训练容量、强壮的后链',
  },
  {
    key: 'dancer',
    label: '舞者',
    teaser: '修长精瘦，核心体态',
    athlete: '米斯蒂·科普兰',
    description: '修长精瘦的肌肉、卓越的核心控制与平衡、强壮的腿部与体态',
  },
  {
    key: 'volleyball',
    label: '排球运动员',
    teaser: '肩背强壮，爆发腿部',
    athlete: '凯丽·沃尔什·詹宁斯',
    description: '强壮的肩部和背部、有力的腿部、运动而具爆发力的身型',
  },
  {
    key: 'sprinter-track',
    label: '短跑／田径运动员',
    teaser: '臀腿有力，爆发精瘦',
    athlete: '阿利森·菲利克斯',
    description: '强壮的臀部和腘绳肌、运动而精瘦的身型、爆发有力的腿部、强壮的核心',
  },
  {
    key: 'martial-artist-boxer',
    label: '格斗／拳击运动员',
    teaser: '精瘦爆发，敏捷体能',
    athlete: '龙达·罗西',
    description: '精瘦、有爆发力、强壮的髋部和核心旋转、敏捷且体能好',
  },
] as const;

// Reference photos live in src/assets/archetypes/ as `<gender>-<key>.<ext>`.
// Vite bundles them (hashed URLs) via this eager glob; we attach the resolved
// URL to each archetype's `image`. An archetype with no matching file keeps
// `image` undefined and the card falls back to the silhouette placeholder.
const ASSETS = import.meta.glob('../assets/archetypes/*.{jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function resolveImage(gender: Gender, key: string): string | undefined {
  const stem = `${gender}-${key}.`;
  for (const [path, url] of Object.entries(ASSETS)) {
    const name = path.split('/').pop() ?? '';
    if (name.startsWith(stem)) return url;
  }
  return undefined;
}

function withImages(gender: Gender, list: readonly Archetype[]): readonly Archetype[] {
  return list.map((a) => ({ ...a, image: resolveImage(gender, a.key) ?? a.image }));
}

export const ARCHETYPES: Record<Gender, readonly Archetype[]> = {
  male: withImages('male', MALE),
  female: withImages('female', FEMALE),
};
