import Handlebars from 'handlebars';
import { getGoogleFontLink } from './utils';

const GENERIC_CSS_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

function sanitizeFontName(raw: string | undefined, fallback = 'Inter'): string {
  if (!raw) return fallback;
  const first = raw.split(',')[0].replace(/['"]|\s*$/g, '').replace(/^\s*/g, '').trim();
  return (first && !GENERIC_CSS_FAMILIES.has(first.toLowerCase())) ? first : fallback;
}

export function generateFullPresentationHtml(slides: any[], layouts: any[], designConfig: any) {
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
  
  const slidesHtml = slides.map((slide) => {
    const layout = layouts.find(l => l.id === slide.layoutId) || layouts[0];
    const template = Handlebars.compile(layout.code);
    const rendered = template(slide.content);
    
    return `
      <div class="slide" style="width: 1280px; height: 720px; overflow: hidden; position: relative; page-break-after: always; background-color: ${designConfig?.background || designConfig?.bg || '#ffffff'};">
        <div id="slide-root" style="width: 100%; height: 100%; box-sizing: border-box;">
          ${rendered}
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.tailwindcss.com"></script>
        ${fontLink ? `<link rel="stylesheet" href="${fontLink}" crossorigin="anonymous">` : ''}
        <style>
          @page {
            size: 1280px 720px;
            margin: 0;
          }
          
          /* Font CSS custom properties */
          :root {
            --font-display: '${sanitizeFontName(designConfig?.typeDisplayXl?.fontFamily || designConfig?.headingFont)}', sans-serif;
            --font-body:    '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}', sans-serif;
            --ds-transition-timing: ${designConfig?.interactionTransitionTiming || '200ms'};
            --ds-transition-easing: ${designConfig?.interactionTransitionEasing || 'cubic-bezier(0.4, 0, 0.2, 1)'};
            --ds-hover-opacity: ${designConfig?.interactionHoverOpacity || 0.08};
            --ds-active-scale: ${designConfig?.interactionActiveScale || 0.98};
          }

          /* Base */
          html, body {
            font-family: '${sanitizeFontName(designConfig?.typeBodyLg?.fontFamily || designConfig?.fontFamily)}', sans-serif !important;
            margin: 0; padding: 0; 
            background-color: #000;
          }

          .slide {
            background-color: ${designConfig?.background || designConfig?.bg || '#fef7ff'}; 
            color: ${designConfig?.onSurface || designConfig?.textPrimary || '#1d1b20'};
          }

          /* Headings get display font directly */
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
        <script>
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

          function applyConfig() {
            if (window.tailwind) {
              tailwind.config = window.tailwindConfig;
            } else {
              setTimeout(applyConfig, 50);
            }
          };
          applyConfig();
        </script>
      </head>
      <body>
        ${slidesHtml}
      </body>
    </html>
  `;
}
