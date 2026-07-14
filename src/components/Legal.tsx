import { useEffect, useRef } from 'react';

export type LegalDoc = 'privacy' | 'terms';

interface Props {
  doc: LegalDoc;
  onClose: () => void;
}

/** Accessible one-page Privacy / Terms overlay. Escape closes; focus moves to
 *  the close button on open and returns to the invoker on unmount. */
export function LegalOverlay({ doc, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const invoker = useRef<Element | null>(null);

  useEffect(() => {
    invoker.current = document.activeElement;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Trap Tab focus within the dialog so it can't reach the background.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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

  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="my-auto w-full max-w-2xl rounded-2xl border border-ink-700 bg-ink-900 p-6 sm:p-8"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="legal-title" className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-ink-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-accent hover:text-accent"
          >
            Close
          </button>
        </div>
        <div className="md text-sm leading-relaxed text-slate-300">
          {doc === 'privacy' ? <Privacy /> : <Terms />}
        </div>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <>
      <p className="text-slate-400">Last updated: this version of BuildTarget.</p>
      <p>
        BuildTarget is a tool that compares a photo of your current build to an athletic physique
        archetype and suggests training focus areas. This page explains, in plain language, what
        happens to your data.
      </p>
      <h3>Your photos</h3>
      <ul>
        <li>
          When you upload a photo, it is sent to our AI provider (Anthropic) to generate the
          comparison and coaching response. That is the only place your photo is sent.
        </li>
        <li>
          We do <strong>not</strong> store your photos on our servers or in any database. They are
          held only in your browser&rsquo;s memory for the current session and are gone when you
          close or refresh the page.
        </li>
        <li>
          Our server logs record only minimal technical metadata (timestamps, status codes, request
          size). We never log your photos or the text of your messages.
        </li>
      </ul>
      <h3>What is stored on your device</h3>
      <ul>
        <li>
          A small flag confirming you met the age requirement, so you aren&rsquo;t asked every
          visit.
        </li>
        <li>
          If a before/after comparison feature is offered, any images you choose to keep are stored
          <strong> only on your device</strong> (in your browser) and are never uploaded to us
          beyond the analysis request above. You can remove them by clearing your browser data.
        </li>
      </ul>
      <h3>Not medical advice</h3>
      <p>
        BuildTarget provides general training information only. It is not medical, health, or
        professional advice, and no analysis it produces should be treated as such.
      </p>
      <h3>Age</h3>
      <p>This tool is intended for users 14 and older.</p>
      <h3>Changes</h3>
      <p>
        The service and this policy may change, be limited, or be discontinued at any time. Continued
        use after a change means you accept the updated policy.
      </p>
    </>
  );
}

function Terms() {
  return (
    <>
      <p className="text-slate-400">Last updated: this version of BuildTarget.</p>
      <p>
        By using BuildTarget, you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t
        use the tool.
      </p>
      <h3>Who can use it</h3>
      <p>
        BuildTarget is intended for users 14 and older. If you are under 18, you should have a parent
        or guardian&rsquo;s permission to use it.
      </p>
      <h3>Not professional advice</h3>
      <p>
        BuildTarget gives general fitness and training information generated by an AI. It is{' '}
        <strong>not</strong> medical, health, nutritional, or other professional advice. Always
        consult a qualified professional before starting a new training program, changing your diet,
        or acting on anything the tool suggests. You use it at your own risk.
      </p>
      <h3>Accuracy</h3>
      <p>
        Responses are generated automatically and may be incomplete or wrong. We don&rsquo;t
        guarantee any particular result, and individual results vary.
      </p>
      <h3>Your responsibilities</h3>
      <ul>
        <li>Only upload photos you have the right to use — don&rsquo;t upload photos of other people without their consent.</li>
        <li>Don&rsquo;t misuse the service or attempt to use it for anything other than its intended training purpose.</li>
      </ul>
      <h3>Availability</h3>
      <p>
        The service is provided &ldquo;as is.&rdquo; It may change, be limited, or be discontinued at
        any time without notice, and we aren&rsquo;t liable for any loss arising from your use of it.
      </p>
      <h3>Changes</h3>
      <p>These terms may be updated. Continued use after a change means you accept the updated terms.</p>
    </>
  );
}
