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

  const title = doc === 'privacy' ? '隐私政策' : '服务条款';

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
            关闭
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
      <p className="text-slate-400">最后更新：本版本的 BuildTarget。</p>
      <p>
        BuildTarget 是一款将你当前体型的照片与运动体型范本进行对比、并建议训练重点的工具。本页用通俗的语言说明你的数据会如何处理。
      </p>
      <h3>你的照片</h3>
      <ul>
        <li>
          当你上传照片时，它会被发送给我们的 AI 服务商（Anthropic），用于生成对比和教练回复。这是你的照片唯一被发送到的地方。
        </li>
        <li>
          我们<strong>不会</strong>将你的照片存储在我们的服务器或任何数据库中。它们仅在当前会话期间保存在你浏览器的内存中，关闭或刷新页面后即消失。
        </li>
        <li>
          我们的服务器日志只记录最少的技术元数据（时间戳、状态码、请求大小）。我们绝不记录你的照片或消息文本。
        </li>
      </ul>
      <h3>存储在你设备上的内容</h3>
      <ul>
        <li>
          一个用于确认你已满足年龄要求的小标记，这样你无需每次访问都被询问。
        </li>
        <li>
          如果提供了前后对比功能，你选择保留的任何图片<strong>仅存储在你的设备上</strong>（在你的浏览器中），除上述分析请求外绝不会上传给我们。你可以通过清除浏览器数据来删除它们。
        </li>
      </ul>
      <h3>并非医疗建议</h3>
      <p>
        BuildTarget 仅提供一般性训练信息。它不是医疗、健康或专业建议，其生成的任何分析都不应被视为此类建议。
      </p>
      <h3>年龄</h3>
      <p>本工具面向 14 岁及以上用户。</p>
      <h3>变更</h3>
      <p>
        本服务及本政策可能随时变更、受到限制或终止。变更后继续使用即表示你接受更新后的政策。
      </p>
    </>
  );
}

function Terms() {
  return (
    <>
      <p className="text-slate-400">最后更新：本版本的 BuildTarget。</p>
      <p>
        使用 BuildTarget 即表示你同意这些条款。如果你不同意，请不要使用本工具。
      </p>
      <h3>谁可以使用</h3>
      <p>
        BuildTarget 面向 14 岁及以上用户。如果你未满 18 岁，应在父母或监护人的许可下使用。
      </p>
      <h3>并非专业建议</h3>
      <p>
        BuildTarget 提供由 AI 生成的一般性健身和训练信息。它<strong>不是</strong>医疗、健康、营养或其他专业建议。在开始新的训练计划、改变饮食或采取本工具建议的任何行动之前，请务必咨询合格的专业人士。使用风险由你自行承担。
      </p>
      <h3>准确性</h3>
      <p>
        回复由系统自动生成，可能不完整或有误。我们不保证任何特定结果，且个体结果会有所不同。
      </p>
      <h3>你的责任</h3>
      <ul>
        <li>只上传你有权使用的照片——未经他人同意，请勿上传他人的照片。</li>
        <li>请勿滥用本服务，或尝试将其用于预期训练用途以外的任何目的。</li>
      </ul>
      <h3>可用性</h3>
      <p>
        本服务按“现状”提供。它可能随时变更、受到限制或终止，恕不另行通知，我们对因你使用本服务而产生的任何损失概不负责。
      </p>
      <h3>变更</h3>
      <p>这些条款可能会更新。变更后继续使用即表示你接受更新后的条款。</p>
    </>
  );
}
