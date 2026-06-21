import { detectMimeFromMagicBytes } from '@/lib/fileUtils';

describe('detectMimeFromMagicBytes', () => {
  it('detects JPEG from magic bytes', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectMimeFromMagicBytes(buf, 'image/jpeg')).toEqual({
      mime: 'image/jpeg',
      valid: true,
    });
  });

  it('detects PNG from magic bytes', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeFromMagicBytes(buf, 'image/png').mime).toBe('image/png');
  });

  it('detects PDF from magic bytes', () => {
    const buf = Buffer.from('%PDF-1.4');
    expect(detectMimeFromMagicBytes(buf, 'application/pdf')).toEqual({
      mime: 'application/pdf',
      valid: true,
    });
  });

  it('detects WEBP from RIFF header', () => {
    const buf = Buffer.alloc(12);
    Buffer.from([0x52, 0x49, 0x46, 0x46]).copy(buf, 0);
    Buffer.from('WEBP').copy(buf, 8);
    expect(detectMimeFromMagicBytes(buf, 'image/webp').mime).toBe('image/webp');
  });

  it('detects GIF from header', () => {
    const buf = Buffer.from('GIF89a');
    expect(detectMimeFromMagicBytes(buf, 'image/gif').mime).toBe('image/gif');
  });

  it('accepts claimed image MIME when bytes are unknown', () => {
    const buf = Buffer.from('unknown-content');
    expect(detectMimeFromMagicBytes(buf, 'image/jpeg')).toEqual({
      mime: 'image/jpeg',
      valid: true,
    });
  });

  it('rejects unknown non-image types', () => {
    const buf = Buffer.from('plain text');
    expect(detectMimeFromMagicBytes(buf, 'text/plain')).toEqual({
      mime: 'text/plain',
      valid: false,
    });
  });
});
