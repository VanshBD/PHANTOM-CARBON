import { sanitizeFilename, validateMimeType } from '@/services/receiptParser';

describe('receiptParser — utilities', () => {
  describe('sanitizeFilename', () => {
    it('strips path traversal characters', () => {
      expect(sanitizeFilename('../../../etc/passwd')).not.toContain('/');
      expect(sanitizeFilename('../../../etc/passwd')).not.toContain('\\');
    });

    it('replaces special characters with underscores', () => {
      const result = sanitizeFilename('my receipt (1).pdf');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
      expect(result).not.toContain(' ');
    });

    it('preserves valid filename characters', () => {
      expect(sanitizeFilename('receipt-2025.pdf')).toBe('receipt-2025.pdf');
      expect(sanitizeFilename('photo_scan.jpg')).toBe('photo_scan.jpg');
    });

    it('truncates filenames longer than 255 characters', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });

    it('handles empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('validateMimeType', () => {
    it('validates JPEG magic bytes (FFD8FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateMimeType(jpegBuffer, 'image/jpeg')).toBe(true);
    });

    it('validates PNG magic bytes (89504E47)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(validateMimeType(pngBuffer, 'image/png')).toBe(true);
    });

    it('validates PDF magic bytes (%PDF)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 header content here');
      expect(validateMimeType(pdfBuffer, 'application/pdf')).toBe(true);
    });

    it('rejects mismatched MIME type', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(validateMimeType(pngBuffer, 'image/jpeg')).toBe(false);
    });

    it('rejects unknown MIME type', () => {
      const buffer = Buffer.from('random data');
      expect(validateMimeType(buffer, 'application/octet-stream')).toBe(false);
    });

    it('rejects fake PDF with wrong magic bytes', () => {
      const fakeBuffer = Buffer.from('Not a real PDF file');
      expect(validateMimeType(fakeBuffer, 'application/pdf')).toBe(false);
    });
  });
});
