/**
 * Detect actual file type from magic bytes — more reliable than browser MIME type.
 * Returns the detected MIME type and whether the file is an accepted upload format.
 *
 * @param buffer - Raw file bytes
 * @param claimedMime - MIME type reported by the browser (fallback only)
 */
export function detectMimeFromMagicBytes(
  buffer: Buffer,
  claimedMime: string
): { mime: string; valid: boolean } {
  const hex = buffer.subarray(0, 12).toString('hex');
  const str = buffer.subarray(0, 4).toString('ascii');

  if (hex.startsWith('ffd8ff')) return { mime: 'image/jpeg', valid: true };
  if (hex.startsWith('89504e47')) return { mime: 'image/png', valid: true };
  if (str === '%PDF') return { mime: 'application/pdf', valid: true };

  if (hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', valid: true };
  }

  if (str.startsWith('GIF')) return { mime: 'image/gif', valid: true };
  if (buffer.subarray(0, 2).toString('ascii') === 'BM') return { mime: 'image/bmp', valid: true };

  const ftypOffset = buffer.subarray(4, 8).toString('ascii');
  if (ftypOffset === 'ftyp') return { mime: 'image/heic', valid: true };

  const isImageOrPdf = claimedMime.startsWith('image/') || claimedMime === 'application/pdf';
  return { mime: claimedMime, valid: isImageOrPdf };
}
