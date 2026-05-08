const GENERIC_CSS_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

export function sanitizeFontName(raw: string | undefined, fallback = 'Inter'): string {
  if (!raw) return fallback;
  const first = raw.split(',')[0].replace(/['"]|\s*$/g, '').replace(/^\s*/g, '').trim();
  return (first && !GENERIC_CSS_FAMILIES.has(first.toLowerCase())) ? first : fallback;
}
