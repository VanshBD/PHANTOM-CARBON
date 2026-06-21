import fs from 'fs';
import path from 'path';

describe('security headers configuration', () => {
  const configSource = fs.readFileSync(
    path.join(__dirname, '../../../next.config.mjs'),
    'utf8'
  );

  it('includes required security headers on all routes', () => {
    expect(configSource).toContain('Content-Security-Policy');
    expect(configSource).toContain('Strict-Transport-Security');
    expect(configSource).toContain('X-Frame-Options');
    expect(configSource).toContain('X-Content-Type-Options');
    expect(configSource).toContain('Referrer-Policy');
    expect(configSource).toContain('Permissions-Policy');
  });

  it('denies framing and restricts CSP connect-src', () => {
    expect(configSource).toContain("value: 'DENY'");
    expect(configSource).toContain("frame-ancestors 'none'");
    expect(configSource).toContain('https://api.groq.com');
  });
});
