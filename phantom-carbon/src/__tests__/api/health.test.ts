import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns ok status with service name', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.service).toBe('phantom-carbon');
    expect(typeof json.timestamp).toBe('string');
  });
});
