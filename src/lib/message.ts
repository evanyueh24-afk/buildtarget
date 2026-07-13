import type { ImageBlock, ProcessedImage } from '../types';

/** Build an Anthropic image content block from a processed image. */
export function imageBlockOf(image: ProcessedImage): ImageBlock {
  return {
    type: 'image',
    source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
  };
}

/** Data URL for rendering an image content block as a thumbnail. */
export function imageBlockToDataUrl(block: ImageBlock): string {
  return `data:${block.source.media_type};base64,${block.source.data}`;
}
