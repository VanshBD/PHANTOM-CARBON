import {
  sanitizeFilename,
  validateMimeType,
  parseVisionJsonResponse,
  formatReceiptItemsForExtraction,
  parseReceipt,
} from '@/services/receiptParser';

jest.mock('@/lib/groq', () => ({
  getGroqClient: jest.fn(),
}));

jest.mock('@/services/aiExtractor', () => ({
  extractCarbonFromText: jest.fn(),
}));

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { getGroqClient } from '@/lib/groq';
import { extractCarbonFromText } from '@/services/aiExtractor';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';

const mockGetGroqClient = getGroqClient as jest.Mock;
const mockExtract = extractCarbonFromText as jest.Mock;
const mockPdfParse = pdfParse as jest.Mock;
const mockSharp = sharp as jest.Mock;

const mockExtraction = {
  surfaceCarbon: 0.5,
  shadowCarbon: 1.2,
  ghostCarbon: 0.3,
  totalCarbon: 2.0,
  breakdown: { education: 1.2 },
  confidence: 0.85,
  sources: ['tuition'],
  summary: 'Education expense',
};

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

  describe('parseVisionJsonResponse', () => {
    it('parses valid vision JSON', () => {
      const raw = JSON.stringify({
        items: [{ name: 'Tuition Fees', quantity: 1, price: 18500, category: 'education' }],
        store_name: 'Saraswati Coaching',
      });

      const result = parseVisionJsonResponse(raw);
      expect(result?.items).toHaveLength(1);
      expect(result?.storeName).toBe('Saraswati Coaching');
    });

    it('strips markdown fences before parsing', () => {
      const raw = '```json\n' + JSON.stringify({
        items: [{ name: 'Bus pass', quantity: 1, price: 500, category: 'transport' }],
        store_name: null,
      }) + '\n```';

      const result = parseVisionJsonResponse(raw);
      expect(result?.items[0].name).toBe('Bus pass');
    });

    it('returns null for invalid JSON', () => {
      expect(parseVisionJsonResponse('not json')).toBeNull();
    });
  });

  describe('formatReceiptItemsForExtraction', () => {
    it('formats items with store name', () => {
      const text = formatReceiptItemsForExtraction(
        [{ name: 'Tuition', quantity: 1, price: 18500, category: 'education' }],
        'Saraswati Coaching'
      );
      expect(text).toContain('Saraswati Coaching');
      expect(text).toContain('Tuition');
      expect(text).toContain('18500');
    });

    it('returns fallback prompt when no items detected', () => {
      const text = formatReceiptItemsForExtraction([]);
      expect(text).toContain('typical purchase receipt');
    });
  });
});

describe('parseReceipt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtract.mockResolvedValue(mockExtraction);
  });

  it('extracts text from PDF and runs carbon extraction', async () => {
    mockPdfParse.mockResolvedValue({ text: 'Tuition Fees Rs 18500' });

    const result = await parseReceipt(
      Buffer.from('%PDF-1.4 tuition'),
      'application/pdf',
      'receipt.pdf'
    );

    expect(mockPdfParse).toHaveBeenCalled();
    expect(mockExtract).toHaveBeenCalledWith(expect.stringContaining('Tuition Fees'));
    expect(result.extraction.totalCarbon).toBe(2.0);
    expect(result.rawText).toContain('Tuition Fees');
  });

  it('uses vision model for image receipts', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            items: [{ name: 'Tuition', quantity: 1, price: 18500, category: 'education' }],
            store_name: 'Coaching Center',
          }),
        },
      }],
    });

    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    });

    const result = await parseReceipt(jpeg, 'image/jpeg', 'receipt.jpg');

    expect(mockCreate).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(mockExtract).toHaveBeenCalledWith(expect.stringContaining('Coaching Center'));
  });

  it('compresses oversized images before vision call', async () => {
    const largeBuffer = Buffer.alloc(4 * 1024 * 1024, 0xff);
    largeBuffer[0] = 0xff;
    largeBuffer[1] = 0xd8;
    largeBuffer[2] = 0xff;

    const compressed = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    mockSharp.mockReturnValue({
      jpeg: jest.fn().mockReturnValue({
        toBuffer: jest.fn().mockResolvedValue(compressed),
      }),
    });

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            items: [{ name: 'Item', quantity: 1, price: 100, category: 'other' }],
            store_name: null,
          }),
        },
      }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    });

    await parseReceipt(largeBuffer, 'image/jpeg', 'large.jpg');
    expect(mockSharp).toHaveBeenCalled();
  });
});
