import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GENERIC_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace']);

function sanitizeFontName(raw: string): string {
  // A value may be a full CSS font-stack like "'Permanent Marker', cursive".
  // Extract only the first family name and strip surrounding quotes.
  const first = raw.split(',')[0].replace(/['"]/g, '').trim();
  return first;
}

export function getGoogleFontLink(fonts: string[]): string {
  const uniqueFonts = Array.from(
    new Set(
      fonts
        .map(sanitizeFontName)
        .filter(f => f && !GENERIC_FAMILIES.has(f.toLowerCase()))
    )
  );
  if (uniqueFonts.length === 0) return '';

  const fontQuery = uniqueFonts
    .map(f => `${f.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900`)
    .join('&family=');
  return `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
}
