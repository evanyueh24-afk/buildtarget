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
        Before you start
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-slate-300">
        This tool is intended for users 14 and older. By continuing, you confirm you meet this
        requirement.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover sm:w-auto sm:px-10"
      >
        Continue
      </button>
      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        BuildTarget gives general training information, not medical or fitness advice.
      </p>
    </section>
  );
}
