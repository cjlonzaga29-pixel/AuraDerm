// Pure geometry for the product-gallery hover magnifier. Everything is in CSS
// pixels relative to the <img> element's box, so it is independent of page
// scroll and can be unit tested without a DOM.

export type Size = { width: number; height: number };
export type Rect = { left: number; top: number; width: number; height: number };

/** Upper bound on magnification: ~2× reads as a close look, not a blur. */
export const MAX_ZOOM = 2;
/** Below this the source has too few spare pixels for a useful preview. */
export const MIN_ZOOM = 1.25;

/**
 * Where an object-fit: contain image actually paints inside its element box
 * (object-position 50% 50%): the letterbox bands on either side are padding,
 * not image.
 */
export function containedRect(box: Size, natural: Size): Rect {
  if (box.width <= 0 || box.height <= 0 || natural.width <= 0 || natural.height <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  const scale = Math.min(box.width / natural.width, box.height / natural.height);
  const width = natural.width * scale;
  const height = natural.height * scale;
  return { left: (box.width - width) / 2, top: (box.height - height) / 2, width, height };
}

/**
 * Magnification for a rendered image: up to MAX_ZOOM, but never beyond the
 * source's own pixels (enlarging past them adds blur, not detail). Returns
 * null when the source cannot support a meaningful preview.
 */
export function zoomFor(rendered: Size, natural: Size): number | null {
  if (rendered.width <= 0 || rendered.height <= 0) return null;
  const headroom = Math.min(natural.width / rendered.width, natural.height / rendered.height);
  const zoom = Math.min(MAX_ZOOM, headroom);
  return zoom >= MIN_ZOOM ? zoom : null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type MagnifierView = {
  /** Lens rectangle on the displayed image, relative to the img box. */
  lens: Rect;
  /** Size of the magnified image drawn inside the preview. */
  image: Size;
  /** Offset of the magnified image inside the preview (≤ 0 when it overflows). */
  offset: { x: number; y: number };
};

/**
 * Maps a pointer position (relative to the img box) to the magnified view.
 * Returns null when the pointer is over letterbox padding rather than the
 * painted image. Near the edges the view is clamped so the preview never
 * shows space beyond the image.
 */
export function magnify(
  pointer: { x: number; y: number },
  content: Rect,
  zoom: number,
  preview: Size,
): MagnifierView | null {
  const x = pointer.x - content.left;
  const y = pointer.y - content.top;
  if (content.width <= 0 || content.height <= 0) return null;
  if (x < 0 || y < 0 || x > content.width || y > content.height) return null;

  const image = { width: content.width * zoom, height: content.height * zoom };

  // Centre the pointed-at spot, then clamp so the image always fills the
  // preview; an axis smaller than the preview is centred instead.
  const axis = (point: number, imageSize: number, previewSize: number) =>
    imageSize <= previewSize
      ? (previewSize - imageSize) / 2
      : -clamp(point * zoom - previewSize / 2, 0, imageSize - previewSize);

  const offset = { x: axis(x, image.width, preview.width), y: axis(y, image.height, preview.height) };

  // The lens outlines exactly what the preview shows, in displayed pixels.
  const lensWidth = Math.min(content.width, preview.width / zoom);
  const lensHeight = Math.min(content.height, preview.height / zoom);
  const lens = {
    left: content.left + clamp(x - lensWidth / 2, 0, content.width - lensWidth),
    top: content.top + clamp(y - lensHeight / 2, 0, content.height - lensHeight),
    width: lensWidth,
    height: lensHeight,
  };

  return { lens, image, offset };
}
