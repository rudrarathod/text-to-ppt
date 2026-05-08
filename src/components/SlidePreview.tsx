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

const useResolvedData = (data: Record<string, any>) => {
  const [resolved, setResolved] = useState(data);

  useEffect(() => {
    let active = true;
    const blobUrls: string[] = [];

    const resolveImages = async () => {
      // Check if there are any IDB images to resolve
      const needsResolution = Object.values(data).some(v => isIdbImage(v));
      
      if (!needsResolution) {
        if (active) setResolved(data);
        return;
      }

      const nextData = { ...data };
      for (const key in nextData) {
        const val = nextData[key];
        if (isIdbImage(val)) {
          try {
            const blob = await getImage(val);
            if (blob && active) {
              const url = URL.createObjectURL(blob);
              blobUrls.push(url);
              nextData[key] = url;
            }
          } catch (err) {
            console.error("Failed to resolve image:", val, err);
          }
        }
      }
      if (active) setResolved(nextData);
    };

    resolveImages();

    return () => {
      active = false;
      blobUrls.forEach(url => URL.revokeObjectURL(url));
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
        </style>
      </head>
      <body>
        <div id="slide-root" style="width: 100%; height: 100%; box-sizing: border-box;">
          ${renderedHtml}
        </div>

        <!-- Scripts at the end for document.body safety -->
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.js" defer></script>
        
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
               if (document.fonts) await document.fonts.ready;
               
               const element = document.getElementById('slide-root') || document.body;
               return await htmlToImage.toJpeg(element, { 
                  quality: 1, 
                  pixelRatio: 2,
                  backgroundColor: '${designConfig?.background || designConfig?.bg || '#ffffff'}',
                  cacheBust: true,
               });
            };

            window.addEventListener('message', (e) => {
              if (e.data?.type === 'UPDATE_HTML') {
                const root = document.getElementById('slide-root');
                if (root) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(e.data.html, 'text/html');
                  const newContent = doc.getElementById('slide-root')?.innerHTML || doc.body.innerHTML;
                  root.innerHTML = newContent;
                  // Send ready signal after update
                  window.parent.postMessage({ type: 'SLIDE_READY' }, '*');
                }
              }
            });

            const init = () => {
              if (!document.body) return;
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
        <div id="slide-root" class="h-full w-full">
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
  className?: string;
  loading?: boolean;
}>(({ templateCode, data, designConfig, interactive = false, onImageUpload, className, loading = false }, ref) => {
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
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'SLIDE_READY') {
        setIsInternalLoading(false);
      }
      if (e.data?.type === 'IMAGE_UPLOAD' && onImageUpload) {
        const { key, data: base64 } = e.data;
        try {
          const res = await fetch(base64);
          const blob = await res.blob();
          const path = await saveImage(`img-${Date.now()}`, blob);
          onImageUpload(key, path);
        } catch (err) {
          console.error("Failed to save image to IDB:", err);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onImageUpload]);

  const html = useMemo(
    () => generateSlideHtml(templateCode, resolvedData, designConfig, interactive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateCode, JSON.stringify(resolvedData), interactive, JSON.stringify(designConfig)]
  );

  // Tracks if the iframe "shell" (scripts/styles) is ready
  const isShellReady = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // If shell isn't ready or it's a completely new template, do a full write
    if (!isShellReady.current) {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        isShellReady.current = true;
      }
    } else {
      // If shell is ready, just send the update via postMessage
      // This is MUCH faster than doc.write
      iframe.contentWindow?.postMessage({ type: 'UPDATE_HTML', html }, '*');
    }
  }, [html, loading]);

  // Reset shell ready if critical dependencies change or if we are loading (iframe is unmounted)
  useEffect(() => {
    if (loading) {
      setIsInternalLoading(true);
    }
  }, [loading]);

  useEffect(() => {
    isShellReady.current = false;
    setIsInternalLoading(true);
  }, [templateCode, JSON.stringify(designConfig)]);

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
