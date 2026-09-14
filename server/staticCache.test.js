import { describe, expect, test } from 'vitest';
import { getStaticCachePolicy } from './staticCache.js';

describe('getStaticCachePolicy', () => {
  test('forces the PWA shell and service worker to revalidate', () => {
    expect(getStaticCachePolicy('/index.html')).toBe('no-cache');
    expect(getStaticCachePolicy('/sw.js')).toBe('no-cache');
  });

  test('keeps fingerprinted assets cacheable for a year', () => {
    expect(getStaticCachePolicy('/assets/index-DChHnP-6.js')).toBe('public, max-age=31536000, immutable');
  });
});
