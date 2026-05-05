import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGoogleFontLink(fonts: string[]): string {
  const uniqueFonts = Array.from(new Set(fonts)).filter(f => f && f !== 'sans-serif' && f !== 'serif' && f !== 'monospace');
  if (uniqueFonts.length === 0) return '';
  
  const fontQuery = uniqueFonts.map(f => `${f.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900`).join('&family=');
  return `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
}
