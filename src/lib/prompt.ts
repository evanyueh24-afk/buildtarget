import { type Archetype, type Gender, genderLabel } from '../data/archetypes';
import type { ApiMessage, ContentBlock, ProcessedImage } from '../types';
import { imageBlockOf } from './message';

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
  const focus = genderLabel(gender);

  const content: ContentBlock[] = [imageBlockOf(userImage)];
  if (referenceImage) content.push(imageBlockOf(referenceImage));

  const intro = referenceImage
    ? `我是一名${focus}训练者，想练成类似「${archetype.label}」范本的体型——${archetype.description}。

第一张图是我当前体型的照片。第二张图是代表目标「${archetype.label}」体型的参考照片。请从视觉上把我的体型与参考照片进行对比，找出最关键的差距，并推荐具体的健身动作和训练重点，帮助我朝这个方向发展。文字描述可作为补充背景，但你的对比应以你在两张照片中实际看到的内容为依据。`
    : `我是一名${focus}训练者，想练成类似「${archetype.label}」范本的体型——${archetype.description}。

附上的是我当前体型的照片。请把我当前的体型与这个目标范本进行对比，找出最关键的差距，并推荐具体的健身动作和训练重点，帮助我朝这个方向发展。`;

  const text = `${intro}

请以${focus}运动员的体型和自然比例为出发点来给出对比和建议——在不适用时，不要套用「V 字倒三角」等以男性为默认的标准。只评论肌肉发展、比例以及与训练相关的观察；绝不评论体重、体脂或外貌。`;

  content.push({ type: 'text', text });
  return { role: 'user', content };
}
