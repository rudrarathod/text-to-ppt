import { openrouter, StreamOptions } from "./openrouter";
import * as errors from "@openrouter/sdk/models/errors";
import { useAppStore } from "../store";

export async function askAi(prompt: string, options?: { model?: string, stream?: boolean } & StreamOptions): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (openRouterKey && openRouterKey !== "your_api_key_here") {
    let retries = 3;
    let delay = 1000;

    while (retries >= 0) {
      try {
        const stream = await openrouter.chat.send({
          chatRequest: {
            model: options?.model || "google/gemma-4-31b-it:free",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            stream: options?.stream ?? false
          }
        });

        let response = "";
        
        // If streaming is requested, we use the for await loop
        if (options?.stream) {
          // @ts-ignore
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              response += content;
              if (options.onChunk) options.onChunk(content);
            }

            if (chunk.usage && options.onUsage) {
              options.onUsage({
                reasoningTokens: (chunk.usage as any).reasoning_tokens || (chunk.usage as any).reasoningTokens,
                promptTokens: chunk.usage.promptTokens,
                completionTokens: chunk.usage.completionTokens,
                totalTokens: chunk.usage.totalTokens
              });
            }
          }
          return response;
        } else {
          // Non-streaming response
          const res = stream as any; // The SDK returns the full response if stream is false
          return res.choices[0]?.message?.content || "";
        }
      } catch (e: any) {
        const isRateLimit = e instanceof errors.TooManyRequestsResponseError || e.status === 429 || e.name === 'TooManyRequestsResponseError';
        
        if (isRateLimit && retries > 0) {
          console.warn(`OpenRouter rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2;
          continue;
        }

        const errorMsg = isRateLimit 
          ? "AI rate limit reached. Please try again later." 
          : `AI Error: ${e.message || "An unexpected error occurred"}`;
        
        useAppStore.getState().addToast(errorMsg, "error");
        console.error("OpenRouter Error:", e);
        return null;
      }
    }
  } else {
    useAppStore.getState().addToast("OpenRouter API key missing. Please check your .env file.", "error");
  }

  return null;
}

export function buildLayoutPrompt(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): string {
  // Build a comprehensive design system reference from the active config
  const dsRef = designConfig ? `
## DESIGN SYSTEM (Material 3 Tailwind Tokens)
All colors below are available as Tailwind utilities (e.g., bg-lumina-primary, text-lumina-on-surface, border-lumina-outline).

### Color Tokens
| Token | Class Prefix | Value |
|-------|-------------|-------|
| Primary | \`bg-lumina-primary\` / \`text-lumina-primary\` | ${designConfig.primary || 'N/A'} |
| On Primary | \`text-lumina-on-primary\` | ${designConfig.onPrimary || 'N/A'} |
| Primary Container | \`bg-lumina-primary-container\` | ${designConfig.primaryContainer || 'N/A'} |
| On Primary Container | \`text-lumina-on-primary-container\` | ${designConfig.onPrimaryContainer || 'N/A'} |
| Secondary | \`bg-lumina-secondary\` / \`text-lumina-secondary\` | ${designConfig.secondary || 'N/A'} |
| On Secondary | \`text-lumina-on-secondary\` | ${designConfig.onSecondary || 'N/A'} |
| Secondary Container | \`bg-lumina-secondary-container\` | ${designConfig.secondaryContainer || 'N/A'} |
| Tertiary | \`bg-lumina-tertiary\` / \`text-lumina-tertiary\` | ${designConfig.tertiary || 'N/A'} |
| On Tertiary | \`text-lumina-on-tertiary\` | ${designConfig.onTertiary || 'N/A'} |
| Tertiary Container | \`bg-lumina-tertiary-container\` | ${designConfig.tertiaryContainer || 'N/A'} |
| Surface | \`bg-lumina-surface\` | ${designConfig.surface || 'N/A'} |
| Surface Dim | \`bg-lumina-surface-dim\` | ${designConfig.surfaceDim || 'N/A'} |
| Surface Bright | \`bg-lumina-surface-bright\` | ${designConfig.surfaceBright || 'N/A'} |
| Surface Container | \`bg-lumina-surface-container\` | ${designConfig.surfaceContainer || 'N/A'} |
| Surface Container High | \`bg-lumina-surface-high\` | ${designConfig.surfaceContainerHigh || 'N/A'} |
| Surface Container Highest | \`bg-lumina-surface-highest\` | ${designConfig.surfaceContainerHighest || 'N/A'} |
| Surface Variant | \`bg-lumina-surface-variant\` | ${designConfig.surfaceVariant || 'N/A'} |
| On Surface | \`text-lumina-on-surface\` | ${designConfig.onSurface || 'N/A'} |
| On Surface Variant | \`text-lumina-on-surface-variant\` | ${designConfig.onSurfaceVariant || 'N/A'} |
| Background | \`bg-lumina-background\` | ${designConfig.background || designConfig.bg || 'N/A'} |
| On Background | \`text-lumina-on-background\` | ${designConfig.onBackground || 'N/A'} |
| Error | \`bg-lumina-error\` / \`text-lumina-error\` | ${designConfig.error || 'N/A'} |
| On Error | \`text-lumina-on-error\` | ${designConfig.onError || 'N/A'} |
| Outline | \`border-lumina-outline\` | ${designConfig.outline || 'N/A'} |
| Outline Variant | \`border-lumina-outline-variant\` | ${designConfig.outlineVariant || 'N/A'} |
| Inverse Surface | \`bg-lumina-inverse-surface\` | ${designConfig.inverseSurface || 'N/A'} |
| Inverse On Surface | \`text-lumina-inverse-on-surface\` | ${designConfig.inverseOnSurface || 'N/A'} |

### Typography
- **Heading / Display Font**: \`font-display\` → "${designConfig.typeDisplayXl?.fontFamily || designConfig.headingFont || 'Inter'}"
- **Body Font**: \`font-body\` (also the default \`font-sans\`) → "${designConfig.typeBodyLg?.fontFamily || designConfig.fontFamily || 'Inter'}"
- All h1–h6 tags and .font-display elements automatically use the display font.
- All body text and .font-body elements use the body font.

**Semantic Typography Classes** (apply these for consistent sizing):
| Class | Font Size | Weight | Use Case |
|-------|-----------|--------|----------|
| \`.type-display-xl\` | ${designConfig.typeDisplayXl?.fontSize || '57px'} | ${designConfig.typeDisplayXl?.fontWeight || '400'} | Hero titles |
| \`.type-headline-lg\` | ${designConfig.typeHeadlineLg?.fontSize || '32px'} | ${designConfig.typeHeadlineLg?.fontWeight || '400'} | Section headers |
| \`.type-headline-md\` | ${designConfig.typeHeadlineMd?.fontSize || '28px'} | ${designConfig.typeHeadlineMd?.fontWeight || '400'} | Subsection headers |
| \`.type-body-lg\` | ${designConfig.typeBodyLg?.fontSize || '16px'} | ${designConfig.typeBodyLg?.fontWeight || '400'} | Main body text |
| \`.type-body-md\` | ${designConfig.typeBodyMd?.fontSize || '14px'} | ${designConfig.typeBodyMd?.fontWeight || '400'} | Secondary body |
| \`.type-label-sm\` | ${designConfig.typeLabelSm?.fontSize || '11px'} | ${designConfig.typeLabelSm?.fontWeight || '500'} | Labels, tags |
| \`.type-caption\` | ${designConfig.typeCaption?.fontSize || '12px'} | ${designConfig.typeCaption?.fontWeight || '400'} | Captions |

### Border Radius
| Class | Value |
|-------|-------|
| \`rounded-lumina-sm\` | ${designConfig.radiusSm || '4px'} |
| \`rounded-lumina\` | ${designConfig.radiusDefault || '8px'} |
| \`rounded-lumina-md\` | ${designConfig.radiusMd || '12px'} |
| \`rounded-lumina-lg\` | ${designConfig.radiusLg || '16px'} |
| \`rounded-lumina-xl\` | ${designConfig.radiusXl || '28px'} |
| \`rounded-lumina-full\` | ${designConfig.radiusFull || '9999px'} |

### Spacing
| Class | Value |
|-------|-------|
| \`p-lumina-xs\` / \`m-lumina-xs\` / \`gap-lumina-xs\` | ${designConfig.spacingXs || '4px'} |
| \`p-lumina-sm\` / \`m-lumina-sm\` / \`gap-lumina-sm\` | ${designConfig.spacingSm || '8px'} |
| \`p-lumina-md\` / \`m-lumina-md\` / \`gap-lumina-md\` | ${designConfig.spacingMd || '16px'} |
| \`p-lumina-lg\` / \`m-lumina-lg\` / \`gap-lumina-lg\` | ${designConfig.spacingLg || '24px'} |
| \`p-lumina-xl\` / \`m-lumina-xl\` / \`gap-lumina-xl\` | ${designConfig.spacingXl || '32px'} |
| \`gap-lumina-gutter\` | ${designConfig.spacingGutter || '16px'} |

### Box Shadows
| Class | Value |
|-------|-------|
| \`shadow-lumina-sm\` | ${designConfig.shadowSm || '0 1px 3px rgba(0,0,0,0.1)'} |
| \`shadow-lumina-md\` | ${designConfig.shadowMd || '0 4px 6px rgba(0,0,0,0.1)'} |
| \`shadow-lumina-lg\` | ${designConfig.shadowLg || '0 10px 15px rgba(0,0,0,0.1)'} |
| \`shadow-lumina-xl\` | ${designConfig.shadowXl || '0 20px 25px rgba(0,0,0,0.1)'} |

### DESIGN BEST PRACTICES
- Use \`bg-lumina-surface\` or \`bg-lumina-background\` for the slide background — NOT raw hex values.
- Use \`text-lumina-on-surface\` for main text on surface backgrounds.
- Use \`text-lumina-on-primary\` for text ON primary-colored backgrounds.
- Use \`border-lumina-outline-variant\` for subtle dividers.
- Use \`bg-lumina-primary-container\` + \`text-lumina-on-primary-container\` for accent cards/badges.
- Use \`bg-lumina-surface-container\` or \`bg-lumina-surface-high\` for card backgrounds.
- Standard Tailwind utilities (flex, grid, text-4xl, etc.) are also fully available.
` : `
## DESIGN SYSTEM
No custom design config detected. Use standard Tailwind CSS classes.
`;

  return `You are an expert Frontend Developer and Designer creating a robust Handlebars HTML template for a 16:9 aspect ratio presentation slide (Target Resolution: 1280x720).
The context uses Tailwind CSS with a custom Material 3 design system.

${dsRef}

## CANVAS SAFETY RULES
1. The slide is strictly 1280x720 pixels.
2. Use a root container with class "w-full h-full overflow-hidden p-12 flex flex-col" (or similar) to ensure content is safe and contained.
3. Never let content exceed the 720px height; use "overflow-hidden" on nested containers if necessary.
4. Use "object-cover" for images to ensure they fill their containers without distortion.
5. Apply the brand fonts: use \`font-display\` for headings, \`font-body\` (or default) for body text.

## CURRENT CODE
\`\`\`html
${currentCode}
\`\`\`

## CURRENT JSON DATA
\`\`\`json
${currentJson}
\`\`\`

${buildOptionsString(options)}

## USER REQUEST
"${prompt}"

## OUTPUT FORMAT
1. Provide the updated HTML/Handlebars code inside a <slide>...</slide> wrapper.
2. If the user request implies adding new variables or changing existing ones, provide the updated JSON data structure inside a <json>...</json> wrapper that matches the variables used in your updated Handlebars code. Provide mock data that reflects the user request.
IMPORTANT: For any image fields in the mock data, use real, high-quality image URLs from Unsplash (e.g., https://images.unsplash.com/photo-...) by default.
Do not include any other markdown formatting outside these tags.
IMPORTANT: You may see image URLs starting with 'idb-image://'. These are valid local image references. DO NOT change or remove them unless explicitly asked.

## IMAGE PATTERN
If the layout requires an image, you MUST structure it like this to support interactive uploads:
<div class="relative group" data-image-key="imageKeyName">
  {{#if imageKeyName}}
    <img src="{{imageKeyName}}" alt="Image" class="w-full h-full object-cover" />
  {{else}}
    <div class="w-full h-full flex flex-col items-center justify-center bg-lumina-surface-container text-lumina-on-surface-variant border-4 border-dashed border-lumina-outline-variant rounded-lumina-md group-hover:bg-lumina-surface-high group-hover:border-lumina-primary transition-all cursor-pointer">
       <svg class="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
       <span class="text-[10px] font-black uppercase tracking-widest">Click to Upload Image</span>
    </div>
  {{/if}}
</div>`;
}


export interface PromptSettings {
  mood?: string;
  length?: string;
  language?: string;
  style?: string;
  detailLevel?: string;
  model?: string;
}

function buildOptionsString(options?: PromptSettings): string {
  if (!options) return "";
  return `
Context & Preferences:
${options.mood ? `- Mood/Tone: ${options.mood}` : ''}
${options.length ? `- Target Length: ${options.length}` : ''}
${options.language ? `- Language: ${options.language}` : ''}
${options.style ? `- Style/Format: ${options.style}` : ''}
${options.detailLevel ? `- Detail Level / Content Length: ${options.detailLevel}` : ''}
`;
}

export function buildSlideContentPrompt(prompt: string, layoutCode: string, currentJson: string, options?: PromptSettings): string {
  return `You are an expert Presentation Content Creator.
You need to generate or update the JSON data for a slide based on the user's request.
${buildOptionsString(options)}
The slide layout template (Handlebars) is:
\`\`\`html
${layoutCode}
\`\`\`

The current JSON data is:
\`\`\`json
${currentJson}
\`\`\`

User Request: "${prompt}"

Return ONLY the updated JSON data structure inside a <json>...</json> wrapper. The JSON must exactly match the keys expected by the Handlebars template.
IMPORTANT: For any image fields, use real, high-quality image URLs from Unsplash (e.g., https://images.unsplash.com/photo-...) by default. Let the images match the topic of the prompt.
Do not include any HTML or markdown formatting outside these tags.
IMPORTANT: You may see image URLs starting with 'idb-image://'. These are valid local image references. DO NOT change or remove them unless explicitly asked.`;
}

export async function askAiForSlideContent(prompt: string, layoutCode: string, currentJson: string, options?: PromptSettings): Promise<string | null> {
  const text = await askAi(buildSlideContentPrompt(prompt, layoutCode, currentJson, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  
  const markdownMatch = text.match(/```json\n([\s\S]*?)```/i);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }
  
  return text.trim();
}

export function buildPresentationPrompt(prompt: string, layouts: {id: string, name: string, code: string}[], options?: PromptSettings): string {
  const layoutsJson = JSON.stringify(layouts.map(l => ({ id: l.id, name: l.name, layoutTemplate: l.code })), null, 2);

  return `You are an expert Presentation Creator.
You need to generate a full presentation based on the user's request.
${buildOptionsString(options)}
Available slide layouts:
\`\`\`json
${layoutsJson}
\`\`\`

User Request: "${prompt}"

Return ONLY a JSON array of slides inside a <json>...</json> wrapper. 
Each slide object in the array MUST have:
1. "layoutId": The ID of the layout you chose for this slide.
2. "content": The JSON data structure matching what the selected layout's Handlebars template expects.

Ensure you create a logical flow of slides (e.g., Title slide, Table of contents, Content slides, Conclusion).
IMPORTANT: For any image fields in the content, use real, high-quality image URLs from Unsplash (e.g., https://images.unsplash.com/photo-...) by default. Let the images match the topic of the slide.
Do not include any HTML or markdown formatting outside these tags.`;
}

export async function askAiForFullPresentation(prompt: string, layouts: {id: string, name: string, code: string}[], options?: PromptSettings): Promise<any[] | null> {
  const text = await askAi(buildPresentationPrompt(prompt, layouts, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
  let jsonStr = "";
  if (jsonMatch && jsonMatch[1]) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const markdownMatch = text.match(/```json\n([\s\S]*?)```/i);
    if (markdownMatch && markdownMatch[1]) {
      jsonStr = markdownMatch[1].trim();
    } else {
      jsonStr = text.trim();
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function buildDesignConfigPrompt(prompt: string, options?: PromptSettings): string {
  return `You are an expert Brand Designer and UI/UX Architect.
You need to create a professional design system configuration based on a user's brand description or mood.
You must follow the Material 3 design specification for naming and tokens.

User Request: "${prompt}"
${buildOptionsString(options)}

Return ONLY a JSON object inside a <json>...</json> wrapper that matches this schema:

{
  "surface": "hex",
  "surfaceDim": "hex",
  "surfaceBright": "hex",
  "surfaceContainerLowest": "hex",
  "surfaceContainerLow": "hex",
  "surfaceContainer": "hex",
  "surfaceContainerHigh": "hex",
  "surfaceContainerHighest": "hex",
  "surfaceVariant": "hex",
  "onSurface": "hex",
  "onSurfaceVariant": "hex",
  "onBackground": "hex",
  "inverseSurface": "hex",
  "inverseOnSurface": "hex",
  "primary": "hex",
  "onPrimary": "hex",
  "primaryContainer": "hex",
  "onPrimaryContainer": "hex",
  "primaryFixed": "hex",
  "primaryFixedDim": "hex",
  "onPrimaryFixed": "hex",
  "onPrimaryFixedVariant": "hex",
  "inversePrimary": "hex",
  "surfaceTint": "hex",
  "secondary": "hex",
  "onSecondary": "hex",
  "secondaryContainer": "hex",
  "onSecondaryContainer": "hex",
  "secondaryFixed": "hex",
  "secondaryFixedDim": "hex",
  "onSecondaryFixed": "hex",
  "onSecondaryFixedVariant": "hex",
  "tertiary": "hex",
  "onTertiary": "hex",
  "tertiaryContainer": "hex",
  "onTertiaryContainer": "hex",
  "tertiaryFixed": "hex",
  "tertiaryFixedDim": "hex",
  "onTertiaryFixed": "hex",
  "onTertiaryFixedVariant": "hex",
  "error": "hex",
  "onError": "hex",
  "errorContainer": "hex",
  "onErrorContainer": "hex",
  "outline": "hex",
  "outlineVariant": "hex",
  "background": "hex",

  "typeDisplayXl": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeHeadlineLg": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeHeadlineMd": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeBodyLg": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeBodyMd": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeLabelSm": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },
  "typeCaption": { "fontFamily": "string", "fontSize": "string", "fontWeight": "string", "lineHeight": "string", "letterSpacing": "string" },

  "radiusSm": "px",
  "radiusDefault": "px",
  "radiusMd": "px",
  "radiusLg": "px",
  "radiusXl": "px",
  "radiusFull": "9999px",

  "spacingBase": "px",
  "spacingXs": "px",
  "spacingSm": "px",
  "spacingMd": "px",
  "spacingLg": "px",
  "spacingXl": "px",
  "spacingGutter": "px",
  "spacingContainerMax": "px",

  "shadowSm": "string",
  "shadowMd": "string",
  "shadowLg": "string",
  "shadowXl": "string",

  "interactionHoverOpacity": number,
  "interactionFocusGlow": "string",
  "interactionActiveScale": number,
  "interactionTransitionTiming": "ms",
  "interactionTransitionEasing": "cubic-bezier"
}

DESIGN RULES:
1. Colors must be perfectly harmonious.
2. Tonal variations (dim, bright, containers) must be derived correctly from their base colors.
3. Typography must use valid Google Fonts.
4. Shadows must be elegant and subtle.
5. All values must be professional and high-fidelity.

Return ONLY the JSON object inside <json>...</json> tags.`;
}

export async function askAiForDesignConfig(prompt: string, options?: PromptSettings): Promise<any | null> {
  const text = await askAi(buildDesignConfigPrompt(prompt, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch(e) {
    return null;
  }
}

export function buildDesignUpdatePrompt(prompt: string, currentConfig: any, options?: PromptSettings): string {
  return `You are an expert Brand Designer.
Your task is to update an existing design system configuration based on the user's request.

Current Design System:
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

User Request: "${prompt}"
${buildOptionsString(options)}

Return ONLY the updated JSON object inside a <json>...</json> wrapper. 
Maintain the same schema as the current design system, which follows Material 3 tokens.

DESIGN RULES FOR UPDATES:
1. Preserve the structure.
2. Ensure color harmony and accessibility (contrast).
3. Update only relevant tokens while keeping the system cohesive.
4. If the user asks for a stylistic change (e.g., "more rounded"), update all relevant radius tokens (radiusSm, radiusDefault, radiusMd, etc.).

Return ONLY valid JSON inside <json> tags.`;
}

export async function askAiForDesignUpdate(prompt: string, currentConfig: any, options?: PromptSettings): Promise<any | null> {
  const text = await askAi(buildDesignUpdatePrompt(prompt, currentConfig, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch(e) {
    return null;
  }
}

export async function askAiForLayoutCode(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): Promise<{code: string, json: string | null}> {
  const text = await askAi(buildLayoutPrompt(prompt, currentCode, currentJson, designConfig, options), { model: options?.model });
  if (!text) return { code: currentCode, json: null };
  let finalCode = currentCode;
  let finalJson = null;

  // extract between <slide> and </slide>
  const match = text.match(/<slide>([\s\S]*?)<\/slide>/i);
  if (match && match[1]) {
    finalCode = match[1].trim();
  } else {
    // fallback if AI didn't wrap
    finalCode = text.replace(/```html/g, "").replace(/```/g, "").trim();
  }
  
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i);
  if (jsonMatch && jsonMatch[1]) {
    finalJson = jsonMatch[1].trim();
  }

  return { code: finalCode, json: finalJson };
}

export function buildFullTemplatePrompt(prompt: string, currentLayouts: {id: string, name: string}[], options?: PromptSettings): string {
  return `You are an expert Frontend Developer and Designer creating robust Handlebars HTML templates for a 16:9 presentation slide system (1280x720).
The context uses Tailwind CSS with a custom Material 3 design system.

## DESIGN SYSTEM TOKENS (Available as Tailwind classes)
### Colors (prefix with bg-, text-, or border-)
- Primary: \`lumina-primary\`, \`lumina-on-primary\`, \`lumina-primary-container\`, \`lumina-on-primary-container\`
- Secondary: \`lumina-secondary\`, \`lumina-on-secondary\`, \`lumina-secondary-container\`
- Tertiary: \`lumina-tertiary\`, \`lumina-on-tertiary\`, \`lumina-tertiary-container\`
- Surface: \`lumina-surface\`, \`lumina-surface-dim\`, \`lumina-surface-bright\`, \`lumina-surface-container\`, \`lumina-surface-high\`, \`lumina-surface-highest\`, \`lumina-surface-variant\`
- Text: \`lumina-on-surface\`, \`lumina-on-surface-variant\`, \`lumina-on-background\`
- Background: \`lumina-background\`
- Outline: \`lumina-outline\`, \`lumina-outline-variant\`
- Error: \`lumina-error\`, \`lumina-on-error\`
- Inverse: \`lumina-inverse-surface\`, \`lumina-inverse-on-surface\`

### Typography
- \`font-display\` for headings, \`font-body\` / \`font-sans\` for body text
- Typography scale classes: \`.type-display-xl\`, \`.type-headline-lg\`, \`.type-headline-md\`, \`.type-body-lg\`, \`.type-body-md\`, \`.type-label-sm\`, \`.type-caption\`

### Radius: \`rounded-lumina-sm\`, \`rounded-lumina\`, \`rounded-lumina-md\`, \`rounded-lumina-lg\`, \`rounded-lumina-xl\`, \`rounded-lumina-full\`
### Spacing: \`p-lumina-xs\`, \`p-lumina-sm\`, \`p-lumina-md\`, \`p-lumina-lg\`, \`p-lumina-xl\`, \`gap-lumina-gutter\`
### Shadows: \`shadow-lumina-sm\`, \`shadow-lumina-md\`, \`shadow-lumina-lg\`, \`shadow-lumina-xl\`

## CANVAS SAFETY RULES
1. The slide is strictly 1280x720 pixels (16:9).
2. Wrap your code in a root div with "w-full h-full overflow-hidden p-16 flex flex-col".
3. Ensure no element bleeds out of the 1280x720 boundary.
4. Use flexbox and grid to keep content balanced and centered.

User Request for the Full Deck/Template set: "${prompt}"
${buildOptionsString(options)}

Currently existing layouts: ${JSON.stringify(currentLayouts)}

Return ONLY a JSON array of layout objects inside a <json>...</json> wrapper.
Each layout object in the array MUST have:
1. "name": A descriptive name for the layout (e.g., "Title Slide", "Two Column Content").
2. "code": The Handlebars HTML code for the layout. Ensure it uses the design system tokens listed above. Ensure any images follow the data-image-key interactive pattern:
<div class="relative group" data-image-key="imageKeyName">
  {{#if imageKeyName}}
    <img src="{{imageKeyName}}" class="w-full h-full object-cover" alt="" />
  {{else}}
    <div class="w-full h-full flex flex-col items-center justify-center bg-lumina-surface-container text-lumina-on-surface-variant border-4 border-dashed border-lumina-outline-variant rounded-lumina-md group-hover:bg-lumina-surface-high group-hover:border-lumina-primary transition-all cursor-pointer">
       <svg class="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
       <span class="text-[10px] font-black uppercase tracking-widest">Click to Upload Image</span>
    </div>
  {{/if}}
</div>
3. "variant": Choose one of "title", "content", "image-text", "comparison", "divider", or provide a custom string representing its type.
4. "mockData": A JSON object providing default mock data for the handlebars variables used in the "code".

Important: Do not answer with anything outside the <json> tags.`;
}


export async function askAiForFullTemplate(prompt: string, currentLayouts: {id: string, name: string}[], options?: PromptSettings): Promise<any[] | null> {
  const text = await askAi(buildFullTemplatePrompt(prompt, currentLayouts, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
  } catch(e) {}
  return null;
}
export function buildPresentationMagicPrompt(prompt: string, designConfig?: any, options?: PromptSettings): string {
  return `You are an expert Presentation Creator, UI/UX Designer, and Frontend Developer specializing in high-quality, visually engaging presentations.

Your task is to generate a COMPLETE, polished presentation based on the user's request.

---

## 🎯 OUTPUT REQUIREMENTS
* Target aspect ratio: **16:9 (1280x720)**
* Output format: **STRICT JSON array inside <json>...</json>**
* Each slide MUST include:
  1. "title": A descriptive title for the slide.
  2. "code": Unique Handlebars + Tailwind HTML code for the slide.
  3. "content": The JSON data structure matching what your Handlebars code expects.

DO NOT include anything outside the <json> block.

---

## 🎨 DESIGN SYSTEM
${designConfig ? `
### Colors (use ONLY these Tailwind tokens)
* Primary → text-lumina-primary / bg-lumina-primary (${designConfig.primary})
* Secondary → text-lumina-secondary / bg-lumina-secondary (${designConfig.secondary})
* Accent → text-lumina-accent / bg-lumina-accent (${designConfig.accent})
* Background → bg-lumina-bg (${designConfig.bg})
* Surface → bg-lumina-surface (${designConfig.surface})
* Text → text-lumina-text-primary (${designConfig.textPrimary})

### Typography
* Headings → font-display (${designConfig.headingFont})
* Body → font-body (${designConfig.fontFamily})

### Radius
* rounded-lumina
* rounded-lumina-card
* rounded-lumina-btn
` : '- Use standard modern design tokens.'}

---

## 🧩 LAYOUT RULES (VERY STRICT)
Each slide MUST:
* Be wrapped in: "w-full h-full overflow-hidden p-16 flex flex-col justify-center items-center text-center"
* NEVER overflow 1280x720.
* Use balanced spacing (no clutter).
* Use grid/flex for alignment.
* Maintain strong visual hierarchy.

---

## ✨ VISUAL STYLE
* Mood: **${options?.mood || 'Professional'}**
* Style: **${options?.style || 'Modern'}**
* Use:
  - Subtle gradients and glassmorphism (bg-opacity, backdrop-blur) where appropriate.
  - Large, bold typography for headers.
  - Consistent spacing using Tailwind padding/margins.

---

## 🖼 IMAGES
* Use ONLY high-quality Unsplash images (https://images.unsplash.com/photo-...).
* Match image to slide meaning.
* Use 1–2 images per slide MAX.
* Use "object-cover" to ensure they fill their containers.
* **CRITICAL**: To enable interactive uploads, wrap all <img> tags or image containers like this:
  <div class="relative group" data-image-key="imageName">
    {{#if imageName}}
      <img src="{{imageName}}" class="w-full h-full object-cover" alt="" />
    {{else}}
      <div class="w-full h-full flex flex-col items-center justify-center bg-lumina-surface text-lumina-text-secondary border-4 border-dashed border-lumina-border rounded-lumina-card group-hover:bg-lumina-bg group-hover:border-lumina-primary transition-all">
         <svg class="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
         <span class="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
      </div>
    {{/if}}
  </div>

---

## 🧠 CONTENT STYLE
* Target Length: **${options?.length || '6-8 slides'}**
* Detail Level: **${options?.detailLevel || 'Balanced'}**
* Language: **${options?.language || 'English'}**
* Keep text SHORT and SIMPLE.
* Use bullet points and clear headings.

---

## ⚠️ IMPORTANT RULES
* NO generic templates.
* EACH slide must be UNIQUE.
* Avoid repeating layout patterns.
* Code must be clean and valid.
* Do NOT overfill slides with text.

---

## 🎯 USER REQUEST
"${prompt}"

Generate the final presentation now.`;
}

export async function askAiForFullPresentationMagic(prompt: string, designConfig?: any, options?: PromptSettings): Promise<any[] | null> {
  const text = await askAi(buildPresentationMagicPrompt(prompt, designConfig, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return null;
}

export function buildSlideRefinementPrompt(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): string {
  return `You are an expert Presentation Designer.
You need to refine or update a specific 16:9 slide (1280x720) based on the user's request.
${buildOptionsString(options)}

${designConfig ? `## DESIGN SYSTEM (Material 3 Tokens — use as Tailwind classes)
### Colors (prefix with bg-, text-, or border-)
- Primary: \`lumina-primary\` (${designConfig.primary}), \`lumina-on-primary\` (${designConfig.onPrimary}), \`lumina-primary-container\`, \`lumina-on-primary-container\`
- Secondary: \`lumina-secondary\` (${designConfig.secondary}), \`lumina-on-secondary\`, \`lumina-secondary-container\`
- Tertiary: \`lumina-tertiary\`, \`lumina-on-tertiary\`, \`lumina-tertiary-container\`
- Surface: \`lumina-surface\`, \`lumina-surface-container\`, \`lumina-surface-high\`, \`lumina-surface-variant\`
- Text: \`lumina-on-surface\` (${designConfig.onSurface}), \`lumina-on-surface-variant\`, \`lumina-on-background\`
- Background: \`lumina-background\` (${designConfig.background || designConfig.bg})
- Outline: \`lumina-outline\`, \`lumina-outline-variant\`

### Typography
- Heading font: \`font-display\` → "${designConfig.typeDisplayXl?.fontFamily || designConfig.headingFont}"
- Body font: \`font-body\` / \`font-sans\` → "${designConfig.typeBodyLg?.fontFamily || designConfig.fontFamily}"
- Scale: \`.type-display-xl\`, \`.type-headline-lg\`, \`.type-headline-md\`, \`.type-body-lg\`, \`.type-body-md\`, \`.type-label-sm\`, \`.type-caption\`

### Utilities
- Radius: \`rounded-lumina-sm\`, \`rounded-lumina\`, \`rounded-lumina-md\`, \`rounded-lumina-lg\`, \`rounded-lumina-xl\`
- Spacing: \`p-lumina-xs\` .. \`p-lumina-xl\`, \`gap-lumina-gutter\`
- Shadows: \`shadow-lumina-sm\` .. \`shadow-lumina-xl\`
` : ''}

Current Handlebars Code:
\`\`\`html
${currentCode}
\`\`\`

Current JSON Data:
\`\`\`json
${currentJson}
\`\`\`

User Request: "${prompt}"

Return ONLY a JSON object inside a <json>...</json> wrapper with:
1. "code": The updated Handlebars HTML code.
2. "content": The updated JSON data.

Maintain the use of the design system tokens (bg-lumina-surface, text-lumina-on-surface, etc.).
Ensure the slide remains perfectly contained within the 1280x720 canvas with no overflow. Use "overflow-hidden" and "p-16" on the main container.`;
}


export async function askAiForSlideRefinement(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): Promise<{code: string, content: any} | null> {
  const text = await askAi(buildSlideRefinementPrompt(prompt, currentCode, currentJson, designConfig, options), { model: options?.model });
  if (!text) return null;
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {}
  return null;
}
