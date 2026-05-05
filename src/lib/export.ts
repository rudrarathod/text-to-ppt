import Handlebars from 'handlebars';
import { getGoogleFontLink } from './utils';

export function generateFullPresentationHtml(slides: any[], layouts: any[], designConfig: any) {
  const fontLink = getGoogleFontLink([designConfig?.fontFamily || 'Inter', designConfig?.headingFont || 'Inter']);
  
  const slidesHtml = slides.map((slide, index) => {
    const layout = layouts.find(l => l.id === slide.layoutId) || layouts[0];
    const template = Handlebars.compile(layout.code);
    const rendered = template(slide.content);
    
    return `
      <div class="slide" style="width: 1280px; height: 720px; overflow: hidden; position: relative; page-break-after: always; background-color: ${designConfig?.bg || '#ffffff'};">
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
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '${designConfig?.primary || '#D62828'}',
                  secondary: '${designConfig?.secondary || '#003049'}',
                  accent: '${designConfig?.accent || '#F77F00'}',
                  bg: '${designConfig?.bg || '#fcf9f8'}',
                  textPrimary: '${designConfig?.textPrimary || '#1c1b1b'}',
                  textSecondary: '${designConfig?.textSecondary || '#4a4a4a'}',
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
              }
            }
          };
        </script>
        ${fontLink ? `<link rel="stylesheet" href="${fontLink}">` : ''}
        <style>
          @page {
            size: 1280px 720px;
            margin: 0;
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: #000;
          }
          .slide {
            font-family: '${designConfig?.fontFamily || 'Inter'}', sans-serif; 
            color: ${designConfig?.textPrimary || '#1c1b1b'};
          }
          h1, h2, h3, .font-display {
             font-family: '${designConfig?.headingFont || designConfig?.fontFamily || 'Inter'}', sans-serif;
             font-weight: ${designConfig?.headingWeight || '900'};
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${slidesHtml}
      </body>
    </html>
  `;
}
