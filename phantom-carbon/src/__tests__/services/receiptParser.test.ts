import { sanitizeFilename, validateMimeType } from '@/services/receiptParser';

describe('receiptParser — utility functions', () => {

  describe('sanitizeFilename', () => {
    it('replaces spaces with underscores', () => {
      expect(sanitizeFilename('my receipt.pdf')).toBe('my_receipt.pdf');
    });

    it('replaces special characters', () => {
      const result = sanitizeFilename('receipt (1) #2025.jpg');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
      expect(result).not.toContain('#');
      expect(result).not.toContain(' ');
    });

    it('preserves valid characters', () => {
      expect(sanitizeFilename('receipt-2025.pdf')).toBe('receipt-2025.pdf');
      expect(sanitizeFilename('photo_scan.jpg')).toBe('photo_scan.jpg');
      expect(sanitizeFilename('file123.png')).toBe('file123.png');
    });

    it('prevents path traversal', () => {
      const result = sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
      expect(result).not.toContain('..');
    });

    it('truncates to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });

    it('handles empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('collapses multiple dots', () => {
      const result = sanitizeFilename('file...pdf');
      expect(result).not.toContain('...');
    });
  });

  describe('validateMimeType', () => {
    it('validates JPEG magic bytes (FFD8FF)', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(validateMimeType(buf, 'image/jpeg')).toBe(true);
    });

    it('validates PNG magic bytes (89504E47)', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(validateMimeType(buf, 'image/png')).toBe(true);
    });

    it('validates PDF magic bytes (%PDF)', () => {
      const buf = Buffer.from('%PDF-1.4 header content here');
      expect(validateMimeType(buf, 'application/pdf')).toBe(true);
    });

    it('validates WEBP magic bytes (RIFF....WEBP)', () => {
      const buf = Buffer.alloc(12);
      Buffer.from([0x52, 0x49, 0x46, 0x46]).copy(buf, 0); // RIFF
      Buffer.from([0x00, 0x00, 0x00, 0x00]).copy(buf, 4); // size
      Buffer.from('WEBP').copy(buf, 8); // WEBP
      expect(validateMimeType(buf, 'image/webp')).toBe(true);
    });

    it('rejects JPEG bytes claimed as PNG', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(validateMimeType(buf, 'image/png')).toBe(false);
    });

    it('rejects unknown file type', () => {
      const buf = Buffer.from('random text file content');
      expect(validateMimeType(buf, 'text/plain')).toBe(false);
    });

    it('rejects fake PDF with wrong magic bytes', () => {
      const buf = Buffer.from('This is not a PDF file at all');
      expect(validateMimeType(buf, 'application/pdf')).toBe(false);
    });

    it('detects partial JPEG magic bytes', () => {
      const buf = Buffer.from([0xff, 0xd8, 0x00, 0x00]); // starts with ffd8 but incomplete
      // Our function only checks hex.startsWith('ffd8ff') so this should be false
      expect(validateMimeType(buf, 'image/jpeg')).toBe(false);
    });

    it('handles empty buffer gracefully', () => {
      const buf = Buffer.alloc(0);
      expect(validateMimeType(buf, 'image/jpeg')).toBe(false);
    });
  });
});
