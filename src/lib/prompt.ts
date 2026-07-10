import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ApiMessage, ContentBlock, ProcessedImage, ImageBlock } from '../types';

function imageBlock(image: ProcessedImage): ImageBlock {
  return {
    type: 'image',
    source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
  };
}

/**
 * Build the first user turn. The user's photo goes first; when a reference
 * photo for the archetype is available it goes second, and the text asks the AI
 * to visually compare the two builds (the text description stays as context).
 * This text is sent to the AI but NOT shown in the chat UI (the first user
 * bubble renders as the user's photo thumbnail instead).
 *
 * The gender line asks the AI to frame the comparison for that build rather
 * than defaulting to male conventions (e.g. a male "V-taper"), while keeping
 * strictly to muscle development, proportion, and training — never weight,
 * body fat, or appearance.
 */
export function buildAnalysisMessage(
  gender: Gender,
  archetype: Archetype,
  userImage: ProcessedImage,
  referenceImage?: ProcessedImage,
): ApiMessage {
  const focus = genderLabel(gender).toLowerCase();

  const content: ContentBlock[] = [imageBlock(userImage)];
  if (referenceImage) content.push(imageBlock(referenceImage));

  const intro = referenceImage
    ? `I am training as a ${focus} athlete and want to build a physique like the "${archetype.label}" archetype — ${archetype.description}.

The FIRST image is a photo of my current build. The SECOND image is a reference photo representing the target "${archetype.label}" build. Visually compare my build to the reference, identify the most relevant gaps, and recommend specific gym exercises and training focus areas to move toward it. Use the text description as additional context, but base your comparison on what you actually see in the two photos.`
    : `I am training as a ${focus} athlete and want to build a physique like the "${archetype.label}" archetype — ${archetype.description}.

Attached is a photo of my current build. Compare my current physique to that target archetype, identify the most relevant gaps, and recommend specific gym exercises and training focus areas to move toward it.`;

  const text = `${intro}

Frame your comparison and recommendations for a ${focus} athlete's physique and natural proportions — do not assume male-default conventions like a "V-taper" when they don't apply. Comment only on muscle development, proportion, and training-relevant observations; never on weight, body fat, or appearance.`;

  content.push({ type: 'text', text });
  return { role: 'user', content };
}
