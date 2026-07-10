import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ApiMessage, ProcessedImage } from '../types';

/**
 * Build the first user turn: the image plus a prompt that injects the chosen
 * archetype's full description and the training focus (gender). This text is
 * sent to the AI but is NOT shown in the chat UI (the first user bubble renders
 * as the photo thumbnail instead).
 *
 * The gender line asks the AI to frame the comparison for that build rather
 * than defaulting to male conventions (e.g. a male "V-taper" vs. a naturally
 * different female proportion), while keeping strictly to muscle development,
 * proportion, and training — never weight, body fat, or appearance.
 */
export function buildAnalysisMessage(
  gender: Gender,
  archetype: Archetype,
  image: ProcessedImage,
): ApiMessage {
  const focus = genderLabel(gender).toLowerCase();
  const text = `I am training as a ${focus} athlete and want to build a physique like this archetype: "${archetype.label}" — ${archetype.description}.

Attached is a photo of my current build. Compare my current physique to that target archetype, identify the most relevant gaps, and recommend specific gym exercises and training focus areas to move toward it.

Frame your comparison and recommendations for a ${focus} athlete's physique and natural proportions — do not assume male-default conventions like a "V-taper" when they don't apply. Comment only on muscle development, proportion, and training-relevant observations; never on weight, body fat, or appearance.`;

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
