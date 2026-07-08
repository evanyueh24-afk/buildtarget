import type { Archetype } from '../archetypes';
import type { ApiMessage, ProcessedImage } from '../types';

/**
 * Build the first user turn: the image plus a prompt that injects the chosen
 * archetype's full description. This text is sent to the AI but is NOT shown in
 * the chat UI (the first user bubble renders as the photo thumbnail instead).
 */
export function buildAnalysisMessage(
  archetype: Archetype,
  image: ProcessedImage,
): ApiMessage {
  const text = `I want to build a physique like this archetype: "${archetype.label}" — ${archetype.description}.

Attached is a photo of my current build. Compare my current physique to that target archetype, identify the most relevant gaps, and recommend specific gym exercises and training focus areas to move toward it.`;

  return {
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.base64,
        },
      },
      { type: 'text', text },
    ],
  };
}
