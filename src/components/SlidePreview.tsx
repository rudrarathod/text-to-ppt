import React, { useEffect, useRef, useState, useMemo, useImperativeHandle, forwardRef } from "react";
import Handlebars from "handlebars";
import { getGoogleFontLink } from "../lib/utils";
import { saveImage, getImage, isIdbImage } from "../lib/imageStore";

// Register custom helpers for Handlebars
Handlebars.registerHelper('each_limit', function(context, limit, options) {
    if (!Array.isArray(context)) return '';
    let ret = "";
    for (let i = 0, j = Math.min(context.length, limit); i < j; i++) {
        ret = ret + options.fn(context[i]);
    }
    return ret;
});

Handlebars.registerHelper('inc', function(value) {
    return parseInt(value) + 1;
});

Handlebars.registerHelper('dec', function(value) {
    return parseInt(value) - 1;
});

Handlebars.registerHelper('eq', function(v1, v2) {
    return v1 === v2;
});

Handlebars.registerHelper('not', function(value) {
    return !value;
});

Handlebars.registerHelper('add', function(...args) {
    args.pop(); // Remove Handlebars options
    return args.reduce((acc, val) => parseFloat(acc) + parseFloat(val), 0);
});

Handlebars.registerHelper('sub', function(v1, v2) {
    return parseFloat(v1) - parseFloat(v2);
});

Handlebars.registerHelper('mul', function(...args) {
    args.pop(); // Remove Handlebars options
    return args.reduce((acc, val) => parseFloat(acc) * parseFloat(val), 1);
});

Handlebars.registerHelper('div', function(v1, v2) {
    return parseFloat(v1) / parseFloat(v2);
});

Handlebars.registerHelper('mod', function(v1, v2) {
    return parseFloat(v1) % parseFloat(v2);
});

Handlebars.registerHelper('abs', function(value) {
    return Math.abs(parseFloat(value));
});

Handlebars.registerHelper('round', function(value) {
    return Math.round(parseFloat(value));
});

Handlebars.registerHelper('ceil', function(value) {
    return Math.ceil(parseFloat(value));
});

Handlebars.registerHelper('floor', function(value) {
    return Math.floor(parseFloat(value));
});

Handlebars.registerHelper('min', function(...args) {
    args.pop(); // Remove Handlebars options
    return Math.min(...args.map(v => parseFloat(v)));
});

Handlebars.registerHelper('max', function(...args) {
    args.pop(); // Remove Handlebars options
    return Math.max(...args.map(v => parseFloat(v)));
});

const useResolvedData = (data: Record<string, any>) => {
  const resolutionCache = useRef<Record<string, string>>({});

  const [resolved, setResolved] = useState(() => {
    const initial = { ...data };
    for (const k in initial) {
      if (isIdbImage(initial[k])) initial[k] = ""; 
    }
    return initial;
  });

  useEffect(() => {
    let active = true;

    const resolveImages = async () => {
      // 1. Immediately set a safe version of the new data, using cache if available
      const safeData = { ...data };
      for (const k in safeData) {
        if (typeof safeData[k] === 'string') {
          if (resolutionCache.current[safeData[k]]) {
            safeData[k] = resolutionCache.current[safeData[k]];
          } else if (isIdbImage(safeData[k])) {
            safeData[k] = "";
          }
        }
      }
      if (active) setResolved(safeData);

      // 2. Check if there are any new images to resolve
      const needsResolution = Object.values(data).some(v => 
        typeof v === 'string' && !resolutionCache.current[v] && (isIdbImage(v) || (v.startsWith('http') && !v.startsWith(window.location.origin)))
      );
      
      if (!needsResolution) {
        return;
      }

      const nextData = { ...safeData };
      const resolutionPromises = Object.entries(data).map(async ([key, val]) => {
        if (typeof val !== 'string' || resolutionCache.current[val]) return;

        const blobToDataUrl = (blob: Blob): Promise<string> => {
           return new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = () => resolve(reader.result as string);
             reader.onerror = reject;
             reader.readAsDataURL(blob);
           });
        };

        if (isIdbImage(val)) {
          try {
            const blob = await getImage(val);
            if (blob && active) {
              const dataUrl = await blobToDataUrl(blob);
              nextData[key] = dataUrl;
              resolutionCache.current[val] = dataUrl;
            }
          } catch (err) {
            console.error("Failed to resolve IDB image:", val, err);
          }
        } else if (val.startsWith('http') && !val.startsWith(window.location.origin) && !val.startsWith('data:')) {
          try {
            const response = await fetch(val, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              const dataUrl = await blobToDataUrl(blob);
              nextData[key] = dataUrl;
              resolutionCache.current[val] = dataUrl;
            }
          } catch (err) {
            console.warn("Failed to pre-fetch external image (CORS likely):", val);
          }
        }
      });

      await Promise.all(resolutionPromises);
      if (active) setResolved(nextData);
    };

    resolveImages();

    return () => {
      active = false;
    };
  }, [data]);

  return resolved;
};

const GENERIC_CSS_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

/** Extract the first real font name from a CSS font-stack like "'Space Grotesk', sans-serif" */
function sanitizeFontName(raw: string | undefined, fallback = 'Inter'): string {
  if (!raw) return fallback;
  const first = raw.split(',')[0].replace(/['"]|\s*$/g, '').replace(/^\s*/g, '').trim();
  return (first && !GENERIC_CSS_FAMILIES.has(first.toLowerCase())) ? first : fallback;
}

// Cache for compiled Handlebars templates
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export const generateSlideHtml = (templateCode: string, data: Record<string, any>, designConfig?: Record<string, any>, interactive: boolean = false) => {
  let renderedHtml = "";
  try {
    let processedTemplate = templateCode;
    
    // Always upgrade mustaches to triple mustaches so HTML is respected
    const IGNORED_HELPERS = new Set(['if', 'else', 'unless', 'each', 'with', 'as', 'this', '@index', '@key', '@first', '@last', 'inc', 'dec', 'eq', 'not', 'add', 'sub', 'mul', 'div', 'mod', 'abs', 'round', 'ceil', 'floor', 'min', 'max', 'each_limit']);

    // 1. Handle each loops specifically to make array items editable (if interactive) or just unescaped
    processedTemplate = processedTemplate.replace(
      /\{\{#each\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayPath, content) => {
        let updatedContent = content.replace(
          /(?![^<]*>)\{\{\{?\s*(this|\.)\s*\}\}\}?/g,
          (m) => interactive ? `<span data-path="${arrayPath}.{{@index}}" contenteditable="true" class="editable-text-wrapper">{{{this}}}</span>` : `{{{this}}}`
        );
        updatedContent = updatedContent.replace(
          /(?![^<]*>)\{\{\{?\s*this\.([a-zA-Z0-9_.]+)\s*\}\}\}?/g,
          (m, prop) => interactive ? `<span data-path="${arrayPath}.{{@index}}.${prop}" contenteditable="true" class="editable-text-wrapper">{{{this.${prop}}}}</span>` : `{{{this.${prop}}}}`
        );
        return `{{#each ${arrayPath}}}${updatedContent}{{/each}}`;
      }
    );

    // 2. General mustache wrapping for top-level keys
    processedTemplate = processedTemplate.replace(
      /(?![^<]*>)\{\{\{?\s*([a-zA-Z0-9_.]+)\s*\}\}\}?/g,
      (match, key) => {
        if (IGNORED_HELPERS.has(key)) return match;
        return interactive ? `<span data-path="${key}" contenteditable="true" class="editable-text-wrapper">{{{${key}}}}</span>` : `{{{${key}}}}`;
      }
    );

    if (interactive) {
        // Ensure any element with data-image-key gets cursor-pointer
        processedTemplate = processedTemplate.replace(
          /(data-image-key=["'][^"']+["'])/g,
          '$1 style="cursor: pointer;"'
        );

        // Also fallback for raw img tags that don't have data-image-key yet
        processedTemplate = processedTemplate.replace(
          /(<img([^>]*)src=["']\{\{\{?\s*([a-zA-Z0-9_]+)\s*\}\}\}?["']([^>]*)>)/g,
          (match, fullImg, before, key, after) => {
             if (match.includes('data-image-key')) return match;
             return `<span data-image-key="${key}" class="relative group inline-flex w-full h-full cursor-pointer">${fullImg}</span>`;
          }
        );
    }
    
    // Check cache first
    let template = templateCache.get(processedTemplate);
    if (!template) {
      template = Handlebars.compile(processedTemplate);
      templateCache.set(processedTemplate, template);
      
      // Keep cache size reasonable
      if (templateCache.size > 100) {
        const firstKey = templateCache.keys().next().value;
        if (firstKey !== undefined) templateCache.delete(firstKey);
      }
    }
    
    renderedHtml = template(data || {});

    // Post-process to add crossorigin="anonymous" to all images for capture fidelity
    // and ensuring we don't duplicate it if already present
    renderedHtml = renderedHtml.replace(/<img\s+(?![^>]*crossorigin=)/g, '<img crossorigin="anonymous" ');

  } catch (e: any) {
    renderedHtml = `<div style="color: red; padding: 20px; font-family: sans-serif;">Template error: ${e?.message}</div>`;
  }

  const collectedFonts = Array.from(new Set([
    designConfig?.typeDisplayXl?.fontFamily,
    designConfig?.typeHeadlineLg?.fontFamily,
    designConfig?.typeHeadlineMd?.fontFamily,
    designConfig?.typeBodyLg?.fontFamily,
    designConfig?.typeBodyMd?.fontFamily,
    designConfig?.typeLabelSm?.fontFamily,
    designConfig?.typeCaption?.fontFamily,
    designConfig?.fontFamily,
    designConfig?.headingFont
  ])).filter(Boolean) as string[];

  const fontLink = getGoogleFontLink(collectedFonts);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        ${fontLink ? `<link rel="stylesheet" href="${fontLink}" crossorigin="anonymous">` : ''}
        <style>
          /* Font CSS custom properties */
          :root {
            --font-display: '${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily || designConfig?.headingFont)}', sans-serif;
            --font-body:    '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}', sans-serif;
            --ds-transition-timing: ${designConfig?.interactionTransitionTiming || '200ms'};
            --ds-transition-easing: ${designConfig?.interactionTransitionEasing || 'cubic-bezier(0.4, 0, 0.2, 1)'};
            --ds-hover-opacity: ${designConfig?.interactionHoverOpacity || 0.08};
            --ds-active-scale: ${designConfig?.interactionActiveScale || 0.98};
          }

          /* Base — !important overrides Tailwind preflight */
          html, body {
            font-family: '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}', sans-serif !important;
            margin: 0; padding: 0; height: 100vh; width: 100vw; overflow: hidden; 
            background-color: ${designConfig?.background || designConfig?.bg || '#fef7ff'}; 
            color: ${designConfig?.onSurface || designConfig?.textPrimary || '#1d1b20'};
          }

          /* Headings get display font directly — no @apply */
          h1, h2, h3, h4, h5, h6,
          .h1, .h2, .h3, .h4, .h5, .h6 {
            font-family: '${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily || designConfig?.headingFont)}', sans-serif !important;
          }

          /* Tailwind-style utility aliases */
          .font-display { font-family: '${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily || designConfig?.headingFont)}', sans-serif !important; }
          .font-body    { font-family: '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}', sans-serif !important; }

          /* Typography Utility Classes */
          .type-display-xl {
            font-family: '${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeDisplayXl?.fontSize || '57px'};
            font-weight: ${designConfig?.typeDisplayXl?.fontWeight || '400'};
            line-height: ${designConfig?.typeDisplayXl?.lineHeight || '64px'};
            letter-spacing: ${designConfig?.typeDisplayXl?.letterSpacing || '-0.25px'};
          }
          .type-headline-lg {
            font-family: '${sanitizeFontName(designConfig?.typeHeadlineLg?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeHeadlineLg?.fontSize || '32px'};
            font-weight: ${designConfig?.typeHeadlineLg?.fontWeight || '400'};
            line-height: ${designConfig?.typeHeadlineLg?.lineHeight || '40px'};
            letter-spacing: ${designConfig?.typeHeadlineLg?.letterSpacing || '0px'};
          }
          .type-headline-md {
            font-family: '${sanitizeFontName(designConfig?.typeHeadlineMd?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeHeadlineMd?.fontSize || '28px'};
            font-weight: ${designConfig?.typeHeadlineMd?.fontWeight || '400'};
            line-height: ${designConfig?.typeHeadlineMd?.lineHeight || '36px'};
          }
          .type-body-lg {
            font-family: '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeBodyLg?.fontSize || '16px'};
            font-weight: ${designConfig?.typeBodyLg?.fontWeight || '400'};
            line-height: ${designConfig?.typeBodyLg?.lineHeight || '24px'};
            letter-spacing: ${designConfig?.typeBodyLg?.letterSpacing || '0.5px'};
          }
          .type-body-md {
            font-family: '${sanitizeFontName(designConfig?.typeBodyMd?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeBodyMd?.fontSize || '14px'};
            font-weight: ${designConfig?.typeBodyMd?.fontWeight || '400'};
            line-height: ${designConfig?.typeBodyMd?.lineHeight || '20px'};
          }
          .type-label-sm {
            font-family: '${sanitizeFontName(designConfig?.typeLabelSm?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeLabelSm?.fontSize || '11px'};
            font-weight: ${designConfig?.typeLabelSm?.fontWeight || '500'};
            line-height: ${designConfig?.typeLabelSm?.lineHeight || '16px'};
            letter-spacing: ${designConfig?.typeLabelSm?.letterSpacing || '0.5px'};
          }
          .type-caption {
            font-family: '${sanitizeFontName(designConfig?.typeCaption?.fontFamily)}', sans-serif;
            font-size: ${designConfig?.typeCaption?.fontSize || '12px'};
            font-weight: ${designConfig?.typeCaption?.fontWeight || '400'};
            line-height: ${designConfig?.typeCaption?.lineHeight || '16px'};
            letter-spacing: ${designConfig?.typeCaption?.letterSpacing || '0.4px'};
          }

          /* Editable Text Styles */
          .editable-text-wrapper {
            display: inline-block;
            min-width: 1ch;
            outline: 2px solid transparent;
            transition: all 0.2s ease-in-out;
            border-radius: 4px;
            cursor: text;
            position: relative;
          }
          .editable-text-wrapper:empty::before {
            content: 'Type here...';
            color: inherit;
            opacity: 0.4;
            pointer-events: none;
            position: absolute;
            white-space: nowrap;
          }
          .editable-text-wrapper:hover {
            background-color: rgba(103, 80, 164, 0.05);
            outline: 1px dashed rgba(103, 80, 164, 0.5);
            outline-offset: 2px;
          }
          .editable-text-wrapper:focus {
            background-color: rgba(103, 80, 164, 0.08);
            outline: 2px solid rgba(103, 80, 164, 0.8);
            outline-offset: 2px;
            box-shadow: none;
          }
        </style>
      </head>
      <body>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.js"></script>
        
        <script>
          (function() {
            window.tailwindConfig = {
               theme: {
                extend: {
                  colors: {
                    lumina: {
                      // Surfaces
                      surface: '${designConfig?.surface || '#ffffff'}',
                      'surface-dim': '${designConfig?.surfaceDim || '#ded8e1'}',
                      'surface-bright': '${designConfig?.surfaceBright || '#fef7ff'}',
                      'surface-lowest': '${designConfig?.surfaceContainerLowest || '#ffffff'}',
                      'surface-low': '${designConfig?.surfaceContainerLow || '#f7f2fa'}',
                      'surface-container': '${designConfig?.surfaceContainer || '#f3edf7'}',
                      'surface-high': '${designConfig?.surfaceContainerHigh || '#ece6f0'}',
                      'surface-highest': '${designConfig?.surfaceContainerHighest || '#e6e0e9'}',
                      'surface-variant': '${designConfig?.surfaceVariant || '#e7e0eb'}',
                      'on-surface': '${designConfig?.onSurface || '#1d1b20'}',
                      'on-surface-variant': '${designConfig?.onSurfaceVariant || '#49454f'}',
                      'on-background': '${designConfig?.onBackground || '#1d1b20'}',
                      'inverse-surface': '${designConfig?.inverseSurface || '#322f35'}',
                      'inverse-on-surface': '${designConfig?.inverseOnSurface || '#f5eff7'}',

                      // Primary
                      primary: '${designConfig?.primary || '#6750a4'}',
                      'on-primary': '${designConfig?.onPrimary || '#ffffff'}',
                      'primary-container': '${designConfig?.primaryContainer || '#eaddff'}',
                      'on-primary-container': '${designConfig?.onPrimaryContainer || '#21005d'}',
                      'primary-fixed': '${designConfig?.primaryFixed || '#eaddff'}',
                      'primary-fixed-dim': '${designConfig?.primaryFixedDim || '#d0bcff'}',
                      'on-primary-fixed': '${designConfig?.onPrimaryFixed || '#21005d'}',
                      'on-primary-fixed-variant': '${designConfig?.onPrimaryFixedVariant || '#4f378b'}',
                      'inverse-primary': '${designConfig?.inversePrimary || '#d0bcff'}',
                      
                      // Secondary
                      secondary: '${designConfig?.secondary || '#625b71'}',
                      'on-secondary': '${designConfig?.onSecondary || '#ffffff'}',
                      'secondary-container': '${designConfig?.secondaryContainer || '#e8def8'}',
                      'on-secondary-container': '${designConfig?.onSecondaryContainer || '#1d192b'}',
                      'secondary-fixed': '${designConfig?.secondaryFixed || '#e8def8'}',
                      'secondary-fixed-dim': '${designConfig?.secondaryFixedDim || '#ccc2dc'}',
                      
                      // Tertiary
                      tertiary: '${designConfig?.tertiary || '#7d5260'}',
                      'on-tertiary': '${designConfig?.onTertiary || '#ffffff'}',
                      'tertiary-container': '${designConfig?.tertiaryContainer || '#ffd8e4'}',
                      'on-tertiary-container': '${designConfig?.onTertiaryContainer || '#31111d'}',

                      // Error
                      error: '${designConfig?.error || '#b3261e'}',
                      'on-error': '${designConfig?.onError || '#ffffff'}',
                      'error-container': '${designConfig?.errorContainer || '#f9dedc'}',
                      'on-error-container': '${designConfig?.onErrorContainer || '#410e0b'}',

                      // Utils
                      outline: '${designConfig?.outline || '#79747e'}',
                      'outline-variant': '${designConfig?.outlineVariant || '#c4c0c9'}',
                      background: '${designConfig?.background || '#fef7ff'}',
                    }
                  },
                  borderRadius: {
                    'lumina-sm': '${designConfig?.radiusSm || '4px'}',
                    'lumina': '${designConfig?.radiusDefault || '8px'}',
                    'lumina-md': '${designConfig?.radiusMd || '12px'}',
                    'lumina-lg': '${designConfig?.radiusLg || '16px'}',
                    'lumina-xl': '${designConfig?.radiusXl || '28px'}',
                    'lumina-full': '${designConfig?.radiusFull || '9999px'}',
                  },
                  spacing: {
                    'lumina-xs': '${designConfig?.spacingXs || '4px'}',
                    'lumina-sm': '${designConfig?.spacingSm || '8px'}',
                    'lumina-md': '${designConfig?.spacingMd || '16px'}',
                    'lumina-lg': '${designConfig?.spacingLg || '24px'}',
                    'lumina-xl': '${designConfig?.spacingXl || '32px'}',
                    'lumina-gutter': '${designConfig?.spacingGutter || '16px'}',
                  },
                  fontFamily: {
                    sans: ['"${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}"', 'sans-serif'],
                    display: ['"${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily || designConfig?.headingFont)}"', 'sans-serif'],
                  },
                  boxShadow: {
                    'lumina-sm': '${designConfig?.shadowSm || '0 1px 3px rgba(0,0,0,0.1)'}',
                    'lumina-md': '${designConfig?.shadowMd || '0 4px 6px rgba(0,0,0,0.1)'}',
                    'lumina-lg': '${designConfig?.shadowLg || '0 10px 15px rgba(0,0,0,0.1)'}',
                    'lumina-xl': '${designConfig?.shadowXl || '0 20px 25px rgba(0,0,0,0.1)'}',
                  }
                }
              }
            };

            // Apply config once tailwind is ready
            function applyConfig() {
              if (window.tailwind) {
                tailwind.config = window.tailwindConfig;
              } else {
                setTimeout(applyConfig, 50);
              }
            };
            applyConfig();

            window.captureSlide = async () => {
               if (document.readyState === 'loading') {
                 await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
               }
               
               // Wait for fonts
               if (document.fonts) {
                 await Promise.race([
                   document.fonts.ready,
                   new Promise(resolve => setTimeout(resolve, 3000)) // Max wait for fonts
                 ]);
               }
               
               // Wait for all images to be loaded
               const images = Array.from(document.querySelectorAll('img'));
               await Promise.all(images.map(img => {
                 if (img.complete) return Promise.resolve();
                 return new Promise(resolve => {
                   img.onload = resolve;
                   img.onerror = resolve; // Continue even if one fails
                 });
               }));

               // Extra tick for layout settling
               await new Promise(resolve => setTimeout(resolve, 100));
               
               const element = document.getElementById('slide-root') || document.body;
               try {
                 return await htmlToImage.toJpeg(element, { 
                    quality: 1, 
                    pixelRatio: 2,
                    backgroundColor: '${designConfig?.background || designConfig?.bg || '#ffffff'}',
                    cacheBust: false,
                 });
               } catch (err) {
                 console.error("htmlToImage.toJpeg failed:", err);
                 // Fallback
                 return null;
               }
            };

            window.addEventListener('message', (e) => {
              if (e.data?.type === 'UPDATE_HTML') {
                const root = document.getElementById('slide-root');
                if (root) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(e.data.html, 'text/html');
                  const newContent = doc.getElementById('slide-root')?.innerHTML || doc.body.innerHTML;
                  root.innerHTML = newContent;

                  // Force Tailwind CDN to re-scan for new utility classes
                  if (window.tailwind) {
                    tailwind.config = window.tailwindConfig;
                  }

                  // Send ready signal after update
                  window.parent.postMessage({ type: 'SLIDE_READY' }, '*');
                }
              }
            });

            const init = () => {
              if (!document.body) return;
              
              // Handle image clicks
              document.body.addEventListener('click', (e) => {
                 const target = e.target.closest('[data-image-key]');
                 if(target) {
                    const key = target.getAttribute('data-image-key');
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (ie) => {
                      const file = ie.target.files[0];
                      if(file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          window.parent.postMessage({ type: 'IMAGE_UPLOAD', key, data: re.target.result }, '*');
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                 }
              });

              // Handle text updates
              document.body.addEventListener('input', (e) => {
                const target = e.target.closest('[data-path]');
                if (target) {
                  const path = target.getAttribute('data-path');
                  const value = target.innerHTML;
                  
                  // Debounce to parent
                  if (window.textUpdateTimer) clearTimeout(window.textUpdateTimer);
                  window.textUpdateTimer = setTimeout(() => {
                    window.parent.postMessage({ type: 'TEXT_UPDATE', path, value }, '*');
                  }, 200);
                }
              });

              // Prevent Enter in single-line containers and handle Undo/Redo
              document.body.addEventListener('keydown', (e) => {
                // Intercept Undo/Redo inside iframe
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                   e.preventDefault();
                   if (e.shiftKey) {
                     window.parent.postMessage({ type: 'ACTION_REDO' }, '*');
                   } else {
                     window.parent.postMessage({ type: 'ACTION_UNDO' }, '*');
                   }
                   return;
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                   e.preventDefault();
                   window.parent.postMessage({ type: 'ACTION_REDO' }, '*');
                   return;
                }

                const target = e.target.closest('[data-path]');
                if (target && e.key === 'Enter') {
                   const tag = target.parentElement?.tagName;
                   if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'SPAN'].includes(tag)) {
                     e.preventDefault();
                     target.blur();
                   }
                }
              });

              // Floating Rich Text Toolbar
              const toolbar = document.createElement('div');
              toolbar.style.position = 'absolute';
              toolbar.style.display = 'none';
              toolbar.style.background = 'rgba(28, 27, 31, 0.9)';
              toolbar.style.backdropFilter = 'blur(8px)';
              toolbar.style.color = '#fff';
              toolbar.style.padding = '4px';
              toolbar.style.borderRadius = '8px';
              toolbar.style.zIndex = '10000';
              toolbar.style.display = 'flex';
              toolbar.style.gap = '4px';
              toolbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              
              const btnStyle = "padding: 4px 12px; border-radius: 4px; cursor: pointer; font-family: sans-serif; font-size: 14px; border: none; background: transparent; color: white;";
              toolbar.innerHTML = \`
                <button onmousedown="event.preventDefault(); document.execCommand('bold', false, null)" style="\${btnStyle} font-weight: bold;">B</button>
                <button onmousedown="event.preventDefault(); document.execCommand('italic', false, null)" style="\${btnStyle} font-style: italic;">I</button>
                <button onmousedown="event.preventDefault(); document.execCommand('underline', false, null)" style="\${btnStyle} text-decoration: underline;">U</button>
              \`;
              document.body.appendChild(toolbar);

              document.addEventListener('selectionchange', () => {
                const sel = window.getSelection();
                if (sel.rangeCount > 0 && !sel.isCollapsed) {
                  const range = sel.getRangeAt(0);
                  const container = range.commonAncestorContainer;
                  const isEditable = container.nodeType === 1 ? container.closest('[data-path]') : container.parentElement?.closest('[data-path]');
                  
                  if (isEditable) {
                    const rect = range.getBoundingClientRect();
                    toolbar.style.display = 'flex';
                    toolbar.style.top = (rect.top + window.scrollY - 45) + 'px';
                    toolbar.style.left = (rect.left + window.scrollX + (rect.width / 2) - (toolbar.offsetWidth / 2)) + 'px';
                  } else {
                    toolbar.style.display = 'none';
                  }
                } else {
                  toolbar.style.display = 'none';
                }
              });
            };

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', init);
            } else {
              init();
            }

            // Signal that we are ready
            window.parent.postMessage({ type: 'SLIDE_READY' }, '*');
          })();
        </script>
        <div id="slide-root" style="width: 100%; height: 100%; box-sizing: border-box;">
          ${renderedHtml}
        </div>
      </body>
    </html>
  `;
};

export const SlideStatic = forwardRef<any, {
  templateCode: string;
  data: Record<string, any>;
  designConfig?: Record<string, any>;
}>(({ templateCode, data, designConfig }, ref) => {
  const resolvedData = useResolvedData(data);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (iframeRef.current?.contentWindow) {
        return await (iframeRef.current.contentWindow as any).captureSlide();
      }
      return null;
    }
  }));

  const html = useMemo(
    () => generateSlideHtml(templateCode, resolvedData, designConfig, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateCode, JSON.stringify(resolvedData), JSON.stringify(designConfig)]
  );

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <div className="w-[1280px] h-[720px] bg-white overflow-hidden relative">
      <iframe 
        ref={iframeRef}
        className="w-full h-full border-none pointer-events-none"
        title="Static Slide"
      />
    </div>
  );
});

export interface SlidePreviewRef {
  capture: () => Promise<string | null>;
}

export const SlidePreview = forwardRef<SlidePreviewRef, {
  templateCode: string;
  data: Record<string, any>;
  designConfig?: Record<string, any>;
  interactive?: boolean;
  onImageUpload?: (key: string, path: string) => void;
  onTextUpdate?: (path: string, value: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  className?: string;
  loading?: boolean;
}>(({ templateCode, data, designConfig, interactive = false, onImageUpload, onTextUpdate, onUndo, onRedo, className, loading = false }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      if (iframeRef.current?.contentWindow) {
        try {
          return await (iframeRef.current.contentWindow as any).captureSlide();
        } catch (e) {
          console.error("Capture failed", e);
          return null;
        }
      }
      return null;
    }
  }));
  const [zoom, setZoom] = useState(1);
  const resolvedData = useResolvedData(data);

  const [isInternalLoading, setIsInternalLoading] = useState(true);
  const isInternalUpdate = useRef(false);
  const isInitialMount = useRef(true);

  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => {
    onImageUploadRef.current = onImageUpload;
  }, [onImageUpload]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'SLIDE_READY') {
        setIsInternalLoading(false);
      }
      if (e.data?.type === 'ACTION_UNDO') {
        onUndo?.();
      }
      if (e.data?.type === 'ACTION_REDO') {
        onRedo?.();
      }
      if (e.data?.type === 'TEXT_UPDATE') {
        isInternalUpdate.current = true;
        onTextUpdate?.(e.data.path, e.data.value);
      }
      if (e.data?.type === 'IMAGE_UPLOAD' && onImageUploadRef.current) {
        const { key, data: base64 } = e.data;
        try {
          const res = await fetch(base64);
          const blob = await res.blob();
          const path = await saveImage(`img-${Date.now()}`, blob);
          onImageUploadRef.current(key, path);
        } catch (err) {
          console.error("Failed to save image to IDB:", err);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTextUpdate, onUndo, onRedo]);

  const html = useMemo(
    () => generateSlideHtml(templateCode, resolvedData, designConfig, interactive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateCode, JSON.stringify(resolvedData), interactive, JSON.stringify(designConfig)]
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    setIsInternalLoading(true);
    // Safety timeout: if SLIDE_READY doesn't arrive in 5s, hide skeleton anyway
    const timer = setTimeout(() => setIsInternalLoading(false), 5000);

    // Always do a full write to ensure Tailwind CDN processes all classes
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    return () => clearTimeout(timer);
  }, [html]);

  // Reset loading state when loading prop changes
  useEffect(() => {
    if (loading) {
      setIsInternalLoading(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!containerRef.current) return;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver((entries) => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        if (!entries.length) return;
        const { width, height } = entries[0].contentRect;
        if (!width || !height) return;
        const scaleX = width / 1280;
        const scaleY = height / 720;
        const newZoom = Math.max(0.1, Math.min(scaleX, scaleY));
        setZoom(prev => (Math.abs(prev - newZoom) > 0.001 ? newZoom : prev));
      }, 100);
    });
    observer.observe(containerRef.current);
    return () => { observer.disconnect(); if (timerId) clearTimeout(timerId); };
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-1 min-h-0 min-w-0 items-center justify-center ${className || ''}`}>
      <div 
        className="relative overflow-hidden bg-white shadow-2xl rounded-xl ring-1 ring-white/10" 
        style={{ width: 1280 * zoom, height: 720 * zoom, flexShrink: 0 }}
      >
        {(loading || isInternalLoading) && (
          <div 
            className="w-full h-full animate-pulse flex flex-col p-12 gap-6 absolute inset-0 z-10"
            style={{ backgroundColor: designConfig?.bg || designConfig?.background || '#ffffff' }}
          >
             <div className="h-16 w-1/2 bg-black/5 rounded-xl" />
             <div className="space-y-3">
               <div className="h-4 w-full bg-black/5 rounded-full" />
               <div className="h-4 w-full bg-black/5 rounded-full" />
               <div className="h-4 w-3/4 bg-black/5 rounded-full" />
             </div>
             <div className="mt-auto h-32 w-full bg-black/5 rounded-2xl" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            border: 'none',
            pointerEvents: (interactive && !loading && !isInternalLoading) ? 'auto' : 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: (loading || isInternalLoading) ? 'hidden' : 'visible',
            opacity: (loading || isInternalLoading) ? 0 : 1
          }}
          title="Slide Preview"
        />
      </div>
    </div>
  );
});
