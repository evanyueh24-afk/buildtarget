import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  children: string;
}

/**
 * Renders assistant text as Markdown (bold, lists, headings, etc.) instead of
 * raw asterisks. react-markdown does NOT render raw HTML by default, so model
 * output can't inject markup — safe for untrusted text. Element styling lives
 * in the `.md` block in index.css.
 */
export function Markdown({ children }: Props) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
