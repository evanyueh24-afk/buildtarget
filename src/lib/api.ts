import type { ApiMessage } from '../types';

/**
 * Send the full conversation history to our serverless proxy, which injects the
 * system prompt + API key and forwards to Anthropic. Returns the assistant's
 * text. Throws an Error with a user-friendly message on failure.
 */
export async function sendChat(messages: ApiMessage[]): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new Error('无法连接服务器，请检查网络后重试。');
  }

  if (!res.ok) {
    // The proxy returns a friendly { error } string; fall back to a generic one.
    let message = '出了点问题，请重试。';
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { text?: string };
  if (!data.text) {
    throw new Error('AI 返回了空回复，请重试。');
  }
  return data.text;
}
