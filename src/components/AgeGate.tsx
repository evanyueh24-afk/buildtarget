interface Props {
  onContinue: () => void;
}

export function AgeGate({ onContinue }: Props) {
  return (
    <section
      aria-labelledby="age-heading"
      className="mx-auto flex w-full max-w-md flex-col items-center text-center"
    >
      <h2 id="age-heading" className="mb-3 text-2xl font-semibold tracking-tight">
        开始前
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-slate-300">
        本工具面向 14 岁及以上用户。继续即表示你确认自己符合该年龄要求。
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover sm:w-auto sm:px-10"
      >
        继续
      </button>
      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        BuildTarget 提供一般训练信息，并非医疗或健身专业建议。
      </p>
    </section>
  );
}
