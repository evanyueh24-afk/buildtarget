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
  age: '年龄',
  height: '身高',
  weight: '体重',
  occupation: '职业',
  activity: '活动水平',
  sports: '运动背景',
  experience: '训练经验',
  diet: '饮食',
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
    const message = `以下是我的一些资料，帮助你更精准地分析：\n${provided.join(
      '\n',
    )}\n\n请在给出训练建议和总体指导时，把这些信息一并考虑进去。`;
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
        <option value="">不便透露</option>
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
            补充你的资料
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ink-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-accent hover:text-accent"
          >
            取消
          </button>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          全部选填。你提供得越多，方案就越贴合你——包括 BMI、体脂范围、热量需求等大致估算。这些均为一般性估算，并非医疗建议。
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {textInput('age', '例如 27', firstRef)}
          {textInput('occupation', '例如 办公室 / 护士')}
          {textInput('height', '例如 180 cm')}
          {textInput('weight', '例如 75 kg')}
          {selectInput('activity', ['久坐', '轻度活动', '活跃', '非常活跃'])}
          {selectInput('experience', [
            '初学者（不足 1 年）',
            '中级（1-3 年）',
            '高级（3 年以上）',
          ])}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          {textInput('sports', '例如 打过橄榄球，每周跑 5 公里')}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">饮食</span>
            <textarea
              value={fields.diet}
              onChange={(e) => set('diet', e.target.value)}
              rows={2}
              placeholder="你目前的饮食情况、有无偏好（大致说明即可，无需精确数字）"
              className="w-full resize-none rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            使用这些资料
          </button>
        </div>
      </form>
    </div>
  );
}
