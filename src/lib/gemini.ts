import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGemini() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("GEMINI_API_KEY environment variable is missing.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export function buildLayoutPrompt(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): string {
  return `You are an expert Frontend Developer and Designer creating a robust Handlebars HTML template for a 16:9 aspect ratio presentation slide (Target Resolution: 1280x720).
The context uses Tailwind CSS.
${designConfig ? `Brand Guidelines:
- Primary Color: ${designConfig.primary}
- Typography: Heading font is ${designConfig.headingFont}, body font is ${designConfig.fontFamily}.
` : ''}
- Radius: rounded-sm, rounded-md, rounded-lg

CANVAS SAFETY RULES:
1. The slide is strictly 1280x720 pixels.
2. Use a root container with class "w-full h-full overflow-hidden p-12 flex flex-col justify-center items-center" (or similar) to ensure content is safe and centered.
3. Never let content exceed the 720px height; use "overflow-hidden" on nested containers if necessary.
4. Use "object-cover" for images to ensure they fill their containers without distortion.
5. Apply the brand fonts (font-display for headings, font-body for text).

These classes are already loaded in Tailwind.

The current code for the layout is:
\`\`\`html
${currentCode}
\`\`\`

The current JSON data structure is:
\`\`\`json
${currentJson}
\`\`\`

${buildOptionsString(options)}

User Request: "${prompt}"

1. Provide the updated HTML/Handlebars code inside a <slide>...</slide> wrapper.
2. If the user request implies adding new variables or changing existing ones, provide the updated JSON data structure inside a <json>...</json> wrapper that matches the variables used in your updated Handlebars code. Provide mock data that reflects the user request.
IMPORTANT: For any image fields in the mock data, use real, high-quality image URLs from Unsplash (e.g., https://images.unsplash.com/photo-...) by default.
Do not include any other markdown formatting outside these tags.
43. IMPORTANT: You may see image URLs starting with 'idb-image://'. These are valid local image references. DO NOT change or remove them unless explicitly asked.

IMPORTANT FOR IMAGES:
If the layout requires an image, you MUST structure it like this to support interactive uploads:
<div class="relative group" data-image-key="imageKeyName">
  {{#if imageKeyName}}
    <img src="{{imageKeyName}}" alt="Image" class="w-full h-full object-cover" />
  {{else}}
    <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 border-4 border-dashed border-gray-300">
      <svg class="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      <span class="text-xl font-bold mt-2">Upload Image</span>
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
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildSlideContentPrompt(prompt, layoutCode, currentJson, options) }] }]
  });

  const text = res.text || "";
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
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildPresentationPrompt(prompt, layouts, options) }] }]
  });

  const text = res.text || "";
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
Your task is to create a professional design system configuration based on a user's brand description or mood.

User Request: "${prompt}"
${buildOptionsString(options)}

Return ONLY a FLAT JSON object (no nested objects) inside a <json>...</json> wrapper with these specific keys:

- "primary": A brand primary color hex (e.g., "#D62828").
- "primaryHover": A slightly darker or more vibrant version of primary.
- "secondary": A matching accent or secondary color hex.
- "accent": A high-contrast accent color (e.g. for CTAs).
- "bg": Main background color hex.
- "surface": Card/Surface color hex.
- "surfaceContrast": A slightly darker version of surface for depth.
- "fontFamily": A valid Google Font name for Body text (e.g., "Inter").
- "bodySize": Default body text size (e.g., "1.125rem").
- "headingFont": A valid Google Font name for Headings (e.g., "Outfit").
- "headingWeight": CSS font weight for headers (e.g., "800").
- "headingSize": Scale for main headings (e.g., "4rem").
- "letterSpacing": CSS letter spacing (e.g., "-0.04em").
- "textPrimary": Main text color hex.
- "textSecondary": Subdued text color hex.
- "borderRadius": Global border radius (e.g., "0.5rem").
- "buttonRadius": radius for buttons (e.g., "9999px").
- "cardRadius": radius for cards (e.g., "1.5rem").
- "border": Border color for dividers (subtle).
- "sectionPadding": Internal spacing (e.g., "4rem").
- "contentAlignment": Either "left" or "center".
- "shadowSoft": A soft elevation shadow.
- "shadowStrong": A defined depth shadow.
- "transitionSpeed": Global transition time (e.g., "300ms").

GOOGLE FONT ARCHETYPES:
- Professional/Corporate: Inter, Montserrat, Roboto, Open Sans.
- Luxury/Elegant: Playfair Display, Lora, Cormorant Garamond, Prata.
- Playful/Handwriting: Fredoka, Pacifico, Caveat, Patrick Hand, Indie Flower.
- Modern/Futuristic: Space Grotesk, Syne, Urbanist, Clash Display, Lexend.
- Technical/Code: JetBrains Mono, Space Mono, Fira Code.

DESIGN GUIDELINES:
1. Ensure High Contrast: Background and text colors must be readable.
2. Harmony: Colors must belong to a cohesive brand palette.
3. Specificity: Use real Google Font names.
4. Flat Structure: DO NOT nest any objects. All keys must be at the root.

Return ONLY the FLAT JSON object inside <json>...</json> tags.`;
}

export async function askAiForDesignConfig(prompt: string, options?: PromptSettings): Promise<any | null> {
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildDesignConfigPrompt(prompt, options) }] }]
  });

  const text = res.text || "";
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

Return ONLY the updated FLAT JSON object inside a <json>...</json> wrapper. 

THE DESIGN SYSTEM SCHEMA:
- primary, secondary, accent: Core brand colors (Hex).
- bg: Main slide background color.
- surface: Card/container background color.
- surfaceContrast: A slightly different shade for subtle sections.
- textPrimary, textSecondary: Contrast colors for text.
- fontFamily, headingFont: Google Font names (e.g., "Inter", "Playfair Display").
- borderRadius, buttonRadius, cardRadius: Sizing in rem/px (e.g., "0.5rem", "9999px").
- contentAlignment: Either "left" or "center".
- shadowSoft, shadowStrong: CSS shadow values.
- border: Hex color for subtle borders.

Maintain the same keys as the current design system. Ensure the colors and fonts are professional and harmonious.

DESIGN RULES FOR UPDATES:
1. Keep it Flat: Do not introduce nested objects.
2. Be Precise: If the user says "make it darker", update the 'bg', 'surface', and potentially 'primary' colors while maintaining harmony.
3. Typography: If the user asks for a specific vibe, use the Font Archetype Library (e.g., "Playful" -> "Fredoka", "Handwriting" -> "Indie Flower"). If the current font already matches the vibe, pick a DIFFERENT one from the same category to provide a fresh look.
4. Style Logic: For "wavy" or "organic" requests, use very large or irregular borderRadius values (e.g., "3rem"). For "sharp" or "brutalist", use "0px".
5. Contrast: Always ensure text remains readable against its background.

Important: Return ONLY valid JSON inside <json> tags.`;
}

export async function askAiForDesignUpdate(prompt: string, currentConfig: any, options?: PromptSettings): Promise<any | null> {
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildDesignUpdatePrompt(prompt, currentConfig, options) }] }]
  });

  const text = res.text || "";
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch(e) {
    return null;
  }
}

export async function askAiForLayoutCode(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): Promise<{code: string, json: string | null}> {
  const ai = getGemini();
  if (!ai) return { code: currentCode, json: null };
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Complex coding task
    contents: [{ role: "user", parts: [{ text: buildLayoutPrompt(prompt, currentCode, currentJson, designConfig, options) }] }]
  });

  const text = res.text || "";
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
The context uses Tailwind CSS.
The design system tokens you MUST use via standard tailwind classes are configured as:
- Colors: text-lumina-primary, bg-lumina-primary, text-lumina-secondary, bg-lumina-secondary, bg-lumina-bg, bg-lumina-surface, text-lumina-text-primary, text-lumina-text-secondary, border-lumina-border.
- Radius: rounded-sm, rounded-md, rounded-lg

CANVAS SAFETY RULES:
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
2. "code": The Handlebars HTML code for the layout. Ensure it uses the design system appropriately. Ensure any images follow the data-image-key interactive pattern:
<div class="relative group" data-image-key="imageKeyName">
  {{#if imageKeyName}}
    <img src="{{imageKeyName}}" class="w-full h-full object-cover" alt="" />
  {{else}}
    <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 border-4 border-dashed border-gray-300">Upload Image</div>
  {{/if}}
</div>
3. "variant": Choose one of "title", "content", "image-text", "comparison", "divider", or provide a custom string representing its type.
4. "mockData": A JSON object providing default mock data for the handlebars variables used in the "code".

Important: Provide 3 to 6 logical layouts that make up a cohesive presentation template. Do not answer with anything outside the <json> tags.`;
}

export async function askAiForFullTemplate(prompt: string, currentLayouts: {id: string, name: string}[], options?: PromptSettings): Promise<any[] | null> {
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildFullTemplatePrompt(prompt, currentLayouts, options) }] }]
  });
  
  const text = res.text || "";
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
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildPresentationMagicPrompt(prompt, designConfig, options) }] }]
  });

  const text = res.text || "";
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

${designConfig ? `Brand Guidelines:
- Primary Color: ${designConfig.primary}
- Typography: Heading font is ${designConfig.headingFont}, body font is ${designConfig.fontFamily}.
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

Maintain the use of the design system tokens (text-lumina-primary, bg-lumina-bg, etc.).
Ensure the slide remains perfectly contained within the 1280x720 canvas with no overflow. Use "overflow-hidden" and "p-16" on the main container.`;
}

export async function askAiForSlideRefinement(prompt: string, currentCode: string, currentJson: string, designConfig?: any, options?: PromptSettings): Promise<{code: string, content: any} | null> {
  const ai = getGemini();
  if (!ai) return null;
  const res = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: buildSlideRefinementPrompt(prompt, currentCode, currentJson, designConfig, options) }] }]
  });

  const text = res.text || "";
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/i) || text.match(/```json\n([\s\S]*?)```/i);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {}
  return null;
}
