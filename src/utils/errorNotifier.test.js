import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendErrorToWebhook } from './errorNotifier';

describe('errorNotifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends formatted error payload to webhook and returns status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
    });
    global.fetch = mockFetch;

    const res = await sendErrorToWebhook({
      error: new Error('Test error message'),
      source: 'test-suite',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('https://n8n.crm-toolkits.ru/webhook/');
    const body = JSON.parse(options.body);
    expect(body.service).toBe('chinese-study');
    expect(body.error).toBe('Test error message');
    expect(body.source).toBe('test-suite');
    expect(res.ok).toBe(true);
  });
});
