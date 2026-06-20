import {
  registerSchema,
  loginSchema,
  carbonExtractSchema,
  carbonSummarySchema,
  carbonHistorySchema,
  oracleGenerateSchema,
  leaderboardSchema,
  validateFileUpload,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/validators';

describe('validators', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects name shorter than 2 chars', () => {
      const result = registerSchema.safeParse({ name: 'A', email: 'a@b.com', password: 'Password1' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({ name: 'Test', email: 'not-email', password: 'Password1' });
      expect(result.success).toBe(false);
    });

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({ name: 'Test', email: 'a@b.com', password: 'password1' });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({ name: 'Test', email: 'a@b.com', password: 'Password' });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 chars', () => {
      const result = registerSchema.safeParse({ name: 'Test', email: 'a@b.com', password: 'Pa1' });
      expect(result.success).toBe(false);
    });

    it('normalises email to lowercase', () => {
      const result = registerSchema.safeParse({ name: 'Test', email: 'TEST@EXAMPLE.COM', password: 'Password1' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: 'anypassword' });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: '' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'notanemail', password: 'pass' });
      expect(result.success).toBe(false);
    });
  });

  describe('carbonExtractSchema', () => {
    it('accepts valid text', () => {
      const result = carbonExtractSchema.safeParse({ text: 'I drove 10km to work today', inputType: 'CHAT' });
      expect(result.success).toBe(true);
    });

    it('rejects text shorter than 10 chars', () => {
      const result = carbonExtractSchema.safeParse({ text: 'short', inputType: 'CHAT' });
      expect(result.success).toBe(false);
    });

    it('rejects text longer than 2000 chars', () => {
      const result = carbonExtractSchema.safeParse({ text: 'a'.repeat(2001), inputType: 'CHAT' });
      expect(result.success).toBe(false);
    });

    it('defaults inputType to CHAT', () => {
      const result = carbonExtractSchema.safeParse({ text: 'I drove 10km to work today' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.inputType).toBe('CHAT');
    });

    it('accepts SPENDING inputType', () => {
      const result = carbonExtractSchema.safeParse({ text: 'I spent 500 on groceries today', inputType: 'SPENDING' });
      expect(result.success).toBe(true);
    });
  });

  describe('carbonSummarySchema', () => {
    it('accepts valid periods', () => {
      for (const period of ['7d', '30d', '90d']) {
        expect(carbonSummarySchema.safeParse({ period }).success).toBe(true);
      }
    });

    it('rejects invalid period', () => {
      expect(carbonSummarySchema.safeParse({ period: '1y' }).success).toBe(false);
    });

    it('defaults to 7d', () => {
      const result = carbonSummarySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.period).toBe('7d');
    });
  });

  describe('carbonHistorySchema', () => {
    it('accepts valid pagination', () => {
      const result = carbonHistorySchema.safeParse({ page: '2', limit: '10' });
      expect(result.success).toBe(true);
    });

    it('coerces strings to numbers', () => {
      const result = carbonHistorySchema.safeParse({ page: '3', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(result.data.page).toBe(3);
      }
    });

    it('rejects limit > 100', () => {
      const result = carbonHistorySchema.safeParse({ page: '1', limit: '101' });
      expect(result.success).toBe(false);
    });

    it('defaults page to 1 and limit to 20', () => {
      const result = carbonHistorySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('oracleGenerateSchema', () => {
    it('accepts valid city and country', () => {
      const result = oracleGenerateSchema.safeParse({ city: 'Mumbai', country: 'India' });
      expect(result.success).toBe(true);
    });

    it('rejects city shorter than 2 chars', () => {
      const result = oracleGenerateSchema.safeParse({ city: 'M', country: 'India' });
      expect(result.success).toBe(false);
    });

    it('rejects missing country', () => {
      const result = oracleGenerateSchema.safeParse({ city: 'Mumbai' });
      expect(result.success).toBe(false);
    });
  });

  describe('leaderboardSchema', () => {
    it('accepts weekly period', () => {
      expect(leaderboardSchema.safeParse({ period: 'weekly' }).success).toBe(true);
    });

    it('accepts monthly period', () => {
      expect(leaderboardSchema.safeParse({ period: 'monthly' }).success).toBe(true);
    });

    it('rejects invalid period', () => {
      expect(leaderboardSchema.safeParse({ period: 'daily' }).success).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    it('accepts valid PDF under 5MB', () => {
      const result = validateFileUpload({ type: 'application/pdf', size: 1024 * 1024 });
      expect(result.valid).toBe(true);
    });

    it('accepts valid JPEG', () => {
      const result = validateFileUpload({ type: 'image/jpeg', size: 500 * 1024 });
      expect(result.valid).toBe(true);
    });

    it('rejects file exceeding 5MB', () => {
      const result = validateFileUpload({ type: 'image/jpeg', size: MAX_FILE_SIZE_BYTES + 1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('rejects unsupported MIME type', () => {
      const result = validateFileUpload({ type: 'text/plain', size: 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Allowed');
    });

    it('accepts file exactly at 5MB limit', () => {
      const result = validateFileUpload({ type: 'image/png', size: MAX_FILE_SIZE_BYTES });
      expect(result.valid).toBe(true);
    });
  });
});
