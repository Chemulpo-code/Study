export function getStaticCachePolicy(filePath = '') {
  const path = String(filePath).replace(/\\/g, '/');
  if (path.endsWith('/index.html') || path.endsWith('/sw.js') || path.endsWith('/manifest.json')) return 'no-cache';
  if (path.includes('/assets/')) return 'public, max-age=31536000, immutable';
  return 'public, max-age=86400';
}
