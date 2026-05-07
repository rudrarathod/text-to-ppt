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

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Try modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error("Clipboard API failed, falling back", err);
    }
  }

  // Fallback to execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed", err);
    return false;
  }
}
