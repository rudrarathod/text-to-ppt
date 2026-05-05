import React, { useEffect, useRef, useState } from 'react';
import Handlebars from 'handlebars';
import { saveImage, getImage, isIdbImage } from '../lib/imageStore';

interface SlidePreviewProps {
  templateCode: string;
  data: Record<string, any>;
  className?: string;
  designConfig?: Record<string, string>;
  interactive?: boolean;
  onImageUpload?: (key: string, path: string) => void;
}

const getGoogleFontLink = (fonts: string[]) => {
  const uniqueFonts = Array.from(new Set(fonts)).filter(f => f && f !== 'sans-serif' && f !== 'serif' && f !== 'monospace');
  if (uniqueFonts.length === 0) return '';
  return `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => `${f.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900`).join('&family=')}&display=swap`;
};

const useResolvedData = (data: Record<string, any>) => {
  const [resolvedData, setResolvedData] = useState(data);

  useEffect(() => {
    let objectUrls: string[] = [];
    const resolveImages = async () => {
      const newData = { ...data };
      let changed = false;
      for (const [key, value] of Object.entries(newData)) {
        if (isIdbImage(value)) {
          try {
            const blob = await getImage(value);
            if (blob) {
              const url = URL.createObjectURL(blob);
              newData[key] = url;
              objectUrls.push(url);
              changed = true;
            }
          } catch (e) {
            console.error("Failed to resolve image from IDB:", e);
          }
        }
      }
      if (changed) {
        setResolvedData(newData);
      } else {
        setResolvedData(data);
      }
    };
    
    resolveImages();
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [data]);

  return resolvedData;
};

export const SlideStatic: React.FC<{
  templateCode: string;
  data: Record<string, any>;
  designConfig?: Record<string, any>;
}> = ({ templateCode, data, designConfig }) => {
  const resolvedData = useResolvedData(data);
  const renderedHtml = React.useMemo(() => {
    try {
      const template = Handlebars.compile(templateCode);
      return template(resolvedData);
    } catch (e: any) {
      return `<div style="color: red; padding: 20px;">Template error: ${e?.message}</div>`;
    }
  }, [templateCode, resolvedData]);

  const fontImport = React.useMemo(() => {
    return getGoogleFontLink([designConfig?.fontFamily, designConfig?.headingFont]);
  }, [designConfig?.fontFamily, designConfig?.headingFont]);

  const cssVariables = React.useMemo(() => {
    return {
      '--tw-lumina-primary': designConfig?.primary || '#b20112',
      '--tw-lumina-primary-hover': designConfig?.primaryHover || '#d62828',
      '--tw-lumina-secondary': designConfig?.secondary || '#fe6247',
      '--tw-lumina-accent': designConfig?.accent || '#f4f1f1',
      '--tw-lumina-bg': designConfig?.bg || '#fcf9f8',
      '--tw-lumina-surface': designConfig?.surface || '#ffffff',
      '--tw-lumina-surface-contrast': designConfig?.surfaceContrast || '#f3efee',
      '--tw-lumina-text-primary': designConfig?.textPrimary || '#1c1b1b',
      '--tw-lumina-text-secondary': designConfig?.textSecondary || '#5c403d',
      '--tw-lumina-border': designConfig?.border || '#eae7e7',
      '--tw-lumina-radius': designConfig?.borderRadius || '0.75rem',
      '--tw-lumina-btn-radius': designConfig?.buttonRadius || '0.5rem',
      '--tw-lumina-card-radius': designConfig?.cardRadius || '1rem',
      '--tw-lumina-section-padding': designConfig?.sectionPadding || '5rem',
      '--tw-lumina-shadow-soft': designConfig?.shadowSoft || '0 4px 20px rgba(0,0,0,0.05)',
      '--tw-lumina-shadow-strong': designConfig?.shadowStrong || '0 10px 40px rgba(0,0,0,0.1)',
      '--tw-lumina-transition': designConfig?.transitionSpeed || '300ms',
      'fontFamily': designConfig?.fontFamily ? `"${designConfig.fontFamily}", sans-serif` : 'sans-serif',
      '--tw-lumina-heading-font': designConfig?.headingFont ? `"${designConfig.headingFont}", sans-serif` : 'inherit',
      '--tw-lumina-heading-weight': designConfig?.headingWeight || '900',
      '--tw-lumina-heading-size': designConfig?.headingSize || '4rem',
      '--tw-lumina-body-size': designConfig?.bodySize || '1.25rem',
      '--tw-lumina-letter-spacing': designConfig?.letterSpacing || '-0.02em',
    } as React.CSSProperties;
  }, [designConfig]);

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      const scaleX = width / 1280;
      const scaleY = height / 720;
      setZoom(Math.min(scaleX, scaleY));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
      <div 
        className="relative overflow-hidden bg-white shadow-lg" 
        style={{ 
          width: 1280, 
          height: 720, 
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          flexShrink: 0,
          ...cssVariables,
          borderRadius: 'var(--tw-lumina-radius)'
        }}
      >
        <link rel="stylesheet" href={getGoogleFontLink([designConfig?.fontFamily, designConfig?.headingFont])} />
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>
    </div>
  );
};

export const SlidePreview: React.FC<SlidePreviewProps> = ({ templateCode, data, className, designConfig, interactive = false, onImageUpload }) => {
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
      renderedHtml = template(resolvedData || {});
    } catch (e: any) {
      renderedHtml = `<div style="color: red; padding: 20px; font-family: sans-serif;">Template error: ${e?.message}</div>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
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
                  },
                  transitionDuration: {
                    'lumina': '${designConfig?.transitionSpeed || '300ms'}',
                  }
                }
              }
            };

            // Hide content until Tailwind is ready to prevent unstyled flash
            document.documentElement.style.opacity = '0';
            window.addEventListener('load', () => {
              setTimeout(() => {
                document.documentElement.style.transition = 'opacity 0.2s ease-in-out';
                document.documentElement.style.opacity = '1';
              }, 50);
            });
          </script>
          <link rel="stylesheet" href="${getGoogleFontLink([designConfig?.fontFamily || 'Inter', designConfig?.headingFont || 'Inter'])}">
          <style>
            ${getGoogleFontLink([designConfig?.fontFamily || 'Inter', designConfig?.headingFont || 'Inter']) ? '' : ''}
            body { 
              font-family: '${designConfig?.fontFamily || 'Inter'}', sans-serif; 
              margin: 0; 
              padding: 0; 
              height: 100vh; 
              overflow: hidden; 
              background-color: ${designConfig?.bg || '#fcf9f8'}; 
              color: ${designConfig?.textPrimary || '#1c1b1b'};
              text-align: ${designConfig?.contentAlignment || 'center'};
            }
            
            h1, h2, h3, .font-display {
               font-family: '${designConfig?.headingFont || designConfig?.fontFamily || 'Inter'}', sans-serif;
               font-weight: ${designConfig?.headingWeight || '900'};
               letter-spacing: ${designConfig?.letterSpacing || '-0.02em'};
            }

            .rounded-lumina { border-radius: ${designConfig?.borderRadius || '0.75rem'}; }
            .rounded-lumina-btn { border-radius: ${designConfig?.buttonRadius || '0.5rem'}; }
            .rounded-lumina-card { border-radius: ${designConfig?.cardRadius || '1rem'}; }
            
            .shadow-lumina-soft { box-shadow: ${designConfig?.shadowSoft || '0 4px 20px rgba(0,0,0,0.05)'}; }
            .shadow-lumina-strong { box-shadow: ${designConfig?.shadowStrong || '0 10px 40px rgba(0,0,0,0.1)'}; }
            ${interactive ? `
              [data-image-key] {
                position: relative;
                cursor: pointer;
              }
              [data-image-key] * {
                pointer-events: none;
              }
              [data-image-key]::after {
                content: 'Upload Image';
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.6);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: bold;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                border-radius: inherit;
                z-index: 50;
              }
              [data-image-key]:hover::after {
                opacity: 1;
              }
            ` : ''}
          </style>
          ${interactive ? `
          <script>
            document.addEventListener('click', (e) => {
               const target = e.target.closest('[data-image-key]');
               if(target) {
                 e.preventDefault();
                 e.stopPropagation();
                 const input = document.createElement('input');
                 input.type = 'file';
                 input.accept = 'image/*';
                 input.onchange = (ev) => {
                    const file = ev.target.files[0];
                    if(file) {
                      const reader = new FileReader();
                      reader.onload = (re) => {
                         window.parent.postMessage({ type: 'IMAGE_UPLOAD', key: target.dataset.imageKey, data: re.target.result }, '*');
                      };
                      reader.readAsDataURL(file);
                    }
                 };
                 input.click();
               } else {
                 if (e.target.closest('a')) e.preventDefault();
               }
            });
          </script>
          ` : ''}
        </head>
        <body class="${interactive ? 'is-interactive' : ''}">
          <div style="width: 100%; height: 100%; box-sizing: border-box;">
            ${renderedHtml}
          </div>
        </body>
      </html>
    `;

    if (iframeRef.current) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
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
        // We need to fit 1280x720 inside width x height
        const scaleX = width / 1280;
        const scaleY = height / 720;
        const newZoom = Math.max(0.1, Math.min(scaleX, scaleY));
        setZoom((prevZoom) => {
            // Avoid triggering an update if the zoom hasn't changed substantially
            if (Math.abs(prevZoom - newZoom) < 0.005) return prevZoom;
            return newZoom;
        });
      });
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
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
