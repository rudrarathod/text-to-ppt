import React, { useEffect, useRef, useState, useMemo, useImperativeHandle, forwardRef } from "react";
import Handlebars from "handlebars";
import { getGoogleFontLink } from "../lib/utils";
import { saveImage } from "../lib/imageStore";

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
  return useMemo(() => {
    const resolved = { ...data };
    return resolved;
  }, [data]);
};

export const generateSlideHtml = (templateCode: string, data: Record<string, any>, designConfig?: Record<string, any>, interactive: boolean = false) => {
  let renderedHtml = "";
  try {
    let processedTemplate = templateCode;
    if (interactive) {
        processedTemplate = processedTemplate.replace(
          /(<img([^>]*)src=["']\{\{\{?\s*([a-zA-Z0-9_]+)\s*\}\}\}?["']([^>]*)>)/g,
          (match, fullImg, before, key, after) => {
             return `<span data-image-key="${key}" class="relative group inline-flex w-full h-full cursor-pointer">${fullImg}</span>`;
          }
        );
    }
    const template = Handlebars.compile(processedTemplate);
    renderedHtml = template(data || {});
  } catch (e: any) {
    renderedHtml = `<div style="color: red; padding: 20px; font-family: sans-serif;">Template error: ${e?.message}</div>`;
  }

  const fontLink = getGoogleFontLink([designConfig?.fontFamily || 'Inter', designConfig?.headingFont || 'Inter']);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.js"></script>
        <script>
          tailwind.config = {
             theme: {
              extend: {
                colors: {
                  lumina: {
                    primary: '${designConfig?.primary || '#b20112'}',
                    'primary-hover': '${designConfig?.primaryHover || '#d62828'}',
                    secondary: '${designConfig?.secondary || '#fe6247'}',
                    accent: '${designConfig?.accent || '#f4f1f1'}',
                    bg: '${designConfig?.bg || '#fcf9f8'}',
                    surface: '${designConfig?.surface || '#ffffff'}',
                    'surface-contrast': '${designConfig?.surfaceContrast || '#f3efee'}',
                    'text-primary': '${designConfig?.textPrimary || '#1c1b1b'}',
                    'text-secondary': '${designConfig?.textSecondary || '#5c403d'}',
                    border: '${designConfig?.border || '#eae7e7'}',
                  }
                },
                borderRadius: {
                  'lumina': '${designConfig?.borderRadius || '0.75rem'}',
                  'lumina-btn': '${designConfig?.buttonRadius || '0.5rem'}',
                  'lumina-card': '${designConfig?.cardRadius || '1rem'}',
                },
                fontFamily: {
                  sans: ['"${designConfig?.fontFamily || 'Inter'}"', 'sans-serif'],
                  display: ['"${designConfig?.headingFont || 'Inter'}"', 'sans-serif'],
                },
                boxShadow: {
                  'lumina-soft': '${designConfig?.shadowSoft || '0 4px 20px rgba(0,0,0,0.05)'}',
                  'lumina-strong': '${designConfig?.shadowStrong || '0 10px 40px rgba(0,0,0,0.1)'}',
                },
                spacing: {
                  'lumina-section': '${designConfig?.sectionPadding || '5rem'}',
                }
              }
            }
          };

          window.captureSlide = async () => {
             // Wait for fonts to be ready
             if (document.fonts) await document.fonts.ready;
             // Capture
             return await htmlToImage.toJpeg(document.body, { 
                quality: 0.98, 
                pixelRatio: 2,
                backgroundColor: '${designConfig?.bg || '#ffffff'}'
             });
          };
        </script>
        ${fontLink ? `<link rel="stylesheet" href="${fontLink}">` : ''}
        <style>
          body { 
            font-family: '${designConfig?.fontFamily || 'Inter'}', sans-serif; 
            margin: 0; 
            padding: 0; 
            height: 100vh; 
            width: 100vw;
            overflow: hidden; 
            background-color: ${designConfig?.bg || '#fcf9f8'}; 
            color: ${designConfig?.textPrimary || '#1c1b1b'};
          }
          
          h1, h2, h3, .font-display {
             font-family: '${designConfig?.headingFont || designConfig?.fontFamily || 'Inter'}', sans-serif;
             font-weight: ${designConfig?.headingWeight || '900'};
          }
        </style>
      </head>
      <body>
        <div id="slide-root" style="width: 100%; height: 100%; box-sizing: border-box;">
          ${renderedHtml}
        </div>
        ${interactive ? `
        <script>
          document.addEventListener('click', (e) => {
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
        </script>
        ` : ''}
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

  useEffect(() => {
    if (iframeRef.current) {
      const html = generateSlideHtml(templateCode, resolvedData, designConfig, false);
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [templateCode, resolvedData, designConfig]);

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

export const SlidePreview: React.FC<{
  templateCode: string;
  data: Record<string, any>;
  designConfig?: Record<string, any>;
  interactive?: boolean;
  onImageUpload?: (key: string, path: string) => void;
  className?: string;
}> = ({ templateCode, data, designConfig, interactive = false, onImageUpload, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const resolvedData = useResolvedData(data);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
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

  useEffect(() => {
    if (iframeRef.current) {
      const html = generateSlideHtml(templateCode, resolvedData, designConfig, interactive);
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [templateCode, resolvedData, interactive, designConfig]);

  useEffect(() => {
    if (!containerRef.current) return;
    let animationFrameId: number;
    const observer = new ResizeObserver((entries) => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        if (!entries.length) return;
        const { width, height } = entries[0].contentRect;
        const scaleX = width / 1280;
        const scaleY = height / 720;
        const newZoom = Math.max(0.1, Math.min(scaleX, scaleY));
        setZoom(newZoom);
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-1 min-h-0 min-w-0 items-center justify-center ${className || ''}`}>
      <div 
        className="relative overflow-hidden bg-white shadow-2xl rounded-xl ring-1 ring-white/10" 
        style={{ width: 1280 * zoom, height: 720 * zoom, flexShrink: 0 }}
      >
        <iframe
          ref={iframeRef}
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            border: 'none',
            pointerEvents: interactive ? 'auto' : 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          title="Slide Preview"
        />
      </div>
    </div>
  );
};
