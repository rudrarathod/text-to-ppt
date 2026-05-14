import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as idb from 'idb-keyval';
import { temporal } from 'zundo';

export type LayoutVariant = "title" | "content" | "image-text" | "comparison" | "divider";

export interface LayoutDef {
  id: string;
  name: string;
  variant: LayoutVariant;
  code: string; 
  mockData?: any;
}

export interface SlideData {
  id: string;
  layoutId: string; // References LayoutDef.id (optional if code is provided)
  content: Record<string, any>;
  code?: string; // Optional inline Handlebars code for this specific slide
  thumbnail?: string;
}

export interface Presentation {
  id: string;
  name: string;
  templateId: string;

  slides: SlideData[];
  createdAt: number;
  updatedAt: number;
}

export interface DesignConfig {
  // --- COLOR SYSTEM ---
  // Surface
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;

  // Text/On-Surface
  onSurface: string;
  onSurfaceVariant: string;
  onBackground: string;
  inverseSurface: string;
  inverseOnSurface: string;

  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  inversePrimary: string;
  surfaceTint: string;

  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;

  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;

  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Outline/Background
  outline: string;
  outlineVariant: string;
  background: string;

  // --- TYPOGRAPHY SYSTEM ---
  // Tokens: display-xl, headline-lg, headline-md, body-lg, body-md, label-sm, caption
  // Properties: fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
  typeDisplayXl: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeHeadlineLg: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeHeadlineMd: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeBodyLg: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeBodyMd: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeLabelSm: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };
  typeCaption: { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; letterSpacing: string };

  // --- BORDER RADIUS SYSTEM ---
  radiusSm: string;
  radiusDefault: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;

  // --- SPACING SYSTEM ---
  spacingBase: string;
  spacingXs: string;
  spacingSm: string;
  spacingMd: string;
  spacingLg: string;
  spacingXl: string;
  spacingGutter: string;
  spacingContainerMax: string;

  // --- SHADOW & ELEVATION ---
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;

  // --- INTERACTION SYSTEM ---
  interactionHoverOpacity: number;
  interactionFocusGlow: string;
  interactionActiveScale: number;
  interactionTransitionTiming: string;
  interactionTransitionEasing: string;

  // Legacy/Compatibility
  primaryHover: string;
  accent: string;
  bg: string; // Legacy, aliased to background
  surfaceContrast: string;
  textPrimary: string;
  textSecondary: string;
  fontFamily: string;
  headingFont: string;
  headingWeight: string;
  headingSize: string;
  bodySize: string;
  letterSpacing: string;
  borderRadius: string;
  buttonRadius: string;
  cardRadius: string;
  border: string;
  sectionPadding: string;
  contentAlignment: 'left' | 'center';
  shadowSoft: string;
  shadowStrong: string;
  transitionSpeed: string;
}

export interface SlideTemplate {
  id: string;
  name: string;
  designConfig: DesignConfig;
  layouts: LayoutDef[];
  isDefault?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  templates: SlideTemplate[];
  activeTemplateId: string; // Deprecating or keeping as template focus
  
  presentations: Presentation[];
  activePresentationId: string | null;
  
  createTemplate: (name: string, design?: Partial<DesignConfig>) => string;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
  duplicateTemplate: (id: string) => void;
  setActiveTemplate: (id: string) => void;
  
  updateActiveTemplateDesign: (config: Partial<DesignConfig>) => void;
  addLayoutToActiveTemplate: (layout: LayoutDef) => void;
  updateLayoutInActiveTemplate: (layoutId: string, updates: Partial<LayoutDef>) => void;
  updateLayoutInTemplate: (templateId: string, layoutId: string, updates: Partial<LayoutDef>) => void;
  renameLayoutInActiveTemplate: (layoutId: string, name: string) => void;
  removeLayoutFromActiveTemplate: (layoutId: string) => void;
  duplicateLayoutInActiveTemplate: (layoutId: string) => void;
  moveLayoutInActiveTemplate: (layoutId: string, direction: 'up' | 'down') => void;
  reorderLayoutsInActiveTemplate: (layouts: LayoutDef[]) => void;

  createPresentation: (name: string, templateId: string) => string;
  deletePresentation: (id: string) => void;
  setActivePresentation: (id: string | null) => void;
  renamePresentation: (id: string, name: string) => void;
  setPresentationTemplate: (id: string, templateId: string) => void;

  importTemplate: (template: SlideTemplate) => void;
  importPresentation: (presentation: Presentation) => void;

  setSlides: (slides: SlideData[]) => void;
  updateSlideContent: (id: string, content: any) => void;
  updateSlideLayout: (slideId: string, layoutId: string) => void;
  addSlide: (slide: SlideData) => void;
  removeSlide: (slideId: string) => void;
  duplicateSlideInActivePresentation: (slideId: string) => void;
  moveSlideInActivePresentation: (slideId: string, direction: 'up' | 'down') => void;
  updateTemplateDesign: (templateId: string, config: Partial<DesignConfig>) => void;
  updateSlideThumbnail: (slideId: string, thumbnail: string) => void;
  updateSlideCode: (slideId: string, code: string) => void;
  loadDefaultTemplatesFromAssets: () => void;
  
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}


const DEFAULT_LAYOUTS: LayoutDef[] = [
  {
    id: "l-title",
    name: "Standard Title",
    variant: "title",
    code: `<div class="flex flex-col items-center justify-center h-full w-full bg-lumina-background p-lumina-xl text-center">
  <h1 class="text-lumina-primary type-display-xl mb-lumina-md">{{title}}</h1>
  {{#if subtitle}}
    <h2 class="text-lumina-on-surface-variant type-headline-lg">{{subtitle}}</h2>
  {{/if}}
</div>`,
    mockData: {
      title: "Main Presentation Title",
      subtitle: "Professional Subtitle or Presenter Name"
    }
  },
  {
    id: "l-content",
    name: "Bullet Content",
    variant: "content",
    code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-lumina-xl">
  <h2 class="text-lumina-on-surface type-headline-lg mb-lumina-lg border-b-4 border-lumina-primary-container pb-lumina-sm inline-block">{{title}}</h2>
  <ul class="list-disc list-inside text-lumina-on-surface-variant space-y-lumina-md type-body-lg">
    {{#each points}}
      <li class="pl-lumina-sm">{{this}}</li>
    {{/each}}
  </ul>
</div>`,
    mockData: {
      title: "Key Insights & Strategy",
      points: [
        "Leverage Material 3 design system for visual consistency",
        "Implement high-fidelity Handlebars templates",
        "Streamline AI-driven layout generation",
        "Optimized for real-time canvas rendering"
      ]
    }
  },
  {
    id: "l-image-text",
    name: "Image + Text",
    variant: "image-text",
    code: `<div class="flex h-full w-full bg-lumina-surface overflow-hidden">
  <div class="w-1/2 p-lumina-xl flex flex-col justify-center">
    <h2 class="text-lumina-primary type-headline-lg mb-lumina-lg">{{title}}</h2>
    <p class="text-lumina-on-surface-variant type-body-lg leading-relaxed">{{description}}</p>
  </div>
  <div class="w-1/2 flex items-center justify-center p-lumina-lg bg-lumina-surface-container-low">
    <div class="relative w-full h-full flex flex-col justify-center overflow-hidden rounded-lumina-lg shadow-lumina-md group" data-image-key="image">
      {{#if image}}
        <img src="{{image}}" alt="Slide image" class="w-full h-full object-cover" />
      {{else}}
        <div class="w-full h-full flex flex-col items-center justify-center bg-lumina-surface-container text-lumina-on-surface-variant border-4 border-dashed border-lumina-outline-variant rounded-lumina-lg group-hover:bg-lumina-surface-high group-hover:border-lumina-primary transition-all cursor-pointer">
          <svg class="w-16 h-16 mb-lumina-sm opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="type-headline-md font-bold">Image Placeholder</span>
          <span class="type-label-sm mt-lumina-xs opacity-70 uppercase tracking-widest">Click to Upload</span>
        </div>
      {{/if}}
    </div>
  </div>
</div>`,
    mockData: {
      title: "Visual Architecture",
      description: "Combining structural integrity with aesthetic precision. Our design system ensures every component serves a specific user need while maintaining a premium feel.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    }
  },
  {
    id: "l-comparison",
    name: "2-Column Comparison",
    variant: "comparison",
    code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-lumina-xl">
  <h2 class="text-center text-lumina-on-surface type-headline-lg mb-lumina-xl">{{title}}</h2>
  <div class="flex flex-1 gap-lumina-lg">
    <div class="flex-1 bg-lumina-surface-container-low p-lumina-lg rounded-lumina-lg shadow-lumina-sm border border-lumina-outline-variant">
      <h3 class="text-lumina-primary type-headline-md mb-lumina-md">{{leftTitle}}</h3>
      <ul class="list-disc list-inside space-y-lumina-sm text-lumina-on-surface-variant type-body-md">
        {{#each leftPoints}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
    <div class="flex-1 bg-lumina-surface-container-low p-lumina-lg rounded-lumina-lg shadow-lumina-sm border border-lumina-outline-variant">
      <h3 class="text-lumina-secondary type-headline-md mb-lumina-md">{{rightTitle}}</h3>
      <ul class="list-disc list-inside space-y-lumina-sm text-lumina-on-surface-variant type-body-md">
        {{#each rightPoints}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
  </div>
</div>`,
    mockData: {
      title: "Plan Comparison",
      leftTitle: "Starter Edition",
      leftPoints: ["Basic Templates", "Export to PDF", "Cloud Sync"],
      rightTitle: "Enterprise Pro",
      rightPoints: ["Unlimited Templates", "AI Design Assistant", "Team Collaboration", "Custom Export Formats"]
    }
  },
  {
    id: "l-divider",
    name: "Section Divider",
    variant: "divider",
    code: `<div class="flex items-center justify-center h-full w-full bg-lumina-primary text-lumina-on-primary p-lumina-xl">
  <div class="border-t-8 border-lumina-on-primary/30 pt-lumina-lg text-center">
    <h2 class="type-display-xl uppercase tracking-widest drop-shadow-md">{{section}}</h2>
    {{#if description}}
      <p class="type-headline-md mt-lumina-md opacity-80">{{description}}</p>
    {{/if}}
  </div>
</div>`,
    mockData: {
      section: "Next Phase",
      description: "A look into our upcoming roadmap and milestones."
    }
  }
];


const DEFAULT_SLIDES: SlideData[] = [
  {
    id: "s-1",
    layoutId: "l-title",
    content: {
      title: "Quarterly Review Q3",
      subtitle: "Performance & Strategy Overview"
    }
  },
  {
    id: "s-2",
    layoutId: "l-content",
    content: {
      title: "Key Metrics",
      points: [
         "Revenue increased by 15%",
         "Customer churn dropped to 2%",
         "Expanded into 3 new European markets"
      ]
    }
  }
];

export const DEFAULT_DESIGN: DesignConfig = {
  // --- COLOR SYSTEM ---
  surface: '#ffffff',
  surfaceDim: '#ded8e1',
  surfaceBright: '#fef7ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f7f2fa',
  surfaceContainer: '#f3edf7',
  surfaceContainerHigh: '#ece6f0',
  surfaceContainerHighest: '#e6e0e9',
  surfaceVariant: '#e7e0eb',

  onSurface: '#1d1b20',
  onSurfaceVariant: '#49454f',
  onBackground: '#1d1b20',
  inverseSurface: '#322f35',
  inverseOnSurface: '#f5eff7',

  primary: '#6750a4',
  onPrimary: '#ffffff',
  primaryContainer: '#eaddff',
  onPrimaryContainer: '#21005d',
  primaryFixed: '#eaddff',
  primaryFixedDim: '#d0bcff',
  onPrimaryFixed: '#21005d',
  onPrimaryFixedVariant: '#4f378b',
  inversePrimary: '#d0bcff',
  surfaceTint: '#6750a4',

  secondary: '#625b71',
  onSecondary: '#ffffff',
  secondaryContainer: '#e8def8',
  onSecondaryContainer: '#1d192b',
  secondaryFixed: '#e8def8',
  secondaryFixedDim: '#ccc2dc',
  onSecondaryFixed: '#1d192b',
  onSecondaryFixedVariant: '#4a4458',

  tertiary: '#7d5260',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ffd8e4',
  onTertiaryContainer: '#31111d',
  tertiaryFixed: '#ffd8e4',
  tertiaryFixedDim: '#efb8c8',
  onTertiaryFixed: '#31111d',
  onTertiaryFixedVariant: '#633b48',

  error: '#b3261e',
  onError: '#ffffff',
  errorContainer: '#f9dedc',
  onErrorContainer: '#410e0b',

  outline: '#79747e',
  outlineVariant: '#c4c0c9',
  background: '#fef7ff',

  // --- TYPOGRAPHY SYSTEM ---
  typeDisplayXl: { fontFamily: 'Inter', fontSize: '57px', fontWeight: '400', lineHeight: '64px', letterSpacing: '-0.25px' },
  typeHeadlineLg: { fontFamily: 'Inter', fontSize: '32px', fontWeight: '400', lineHeight: '40px', letterSpacing: '0px' },
  typeHeadlineMd: { fontFamily: 'Inter', fontSize: '28px', fontWeight: '400', lineHeight: '36px', letterSpacing: '0px' },
  typeBodyLg: { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', letterSpacing: '0.5px' },
  typeBodyMd: { fontFamily: 'Inter', fontSize: '14px', fontWeight: '400', lineHeight: '20px', letterSpacing: '0.25px' },
  typeLabelSm: { fontFamily: 'Inter', fontSize: '11px', fontWeight: '500', lineHeight: '16px', letterSpacing: '0.5px' },
  typeCaption: { fontFamily: 'Inter', fontSize: '12px', fontWeight: '400', lineHeight: '16px', letterSpacing: '0.4px' },

  // --- BORDER RADIUS SYSTEM ---
  radiusSm: '4px',
  radiusDefault: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '28px',
  radiusFull: '9999px',

  // --- SPACING SYSTEM ---
  spacingBase: '4px',
  spacingXs: '4px',
  spacingSm: '8px',
  spacingMd: '16px',
  spacingLg: '24px',
  spacingXl: '32px',
  spacingGutter: '16px',
  spacingContainerMax: '1200px',

  // --- SHADOW & ELEVATION ---
  shadowSm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // --- INTERACTION SYSTEM ---
  interactionHoverOpacity: 0.08,
  interactionFocusGlow: '0 0 0 3px rgba(103, 80, 164, 0.5)',
  interactionActiveScale: 0.98,
  interactionTransitionTiming: '200ms',
  interactionTransitionEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Legacy/Compatibility
  primaryHover: '#4f378b',
  accent: '#7d5260',
  bg: '#fef7ff',
  surfaceContrast: '#e6e0e9',
  textPrimary: '#1d1b20',
  textSecondary: '#49454f',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  headingWeight: '400',
  headingSize: '32px',
  bodySize: '16px',
  letterSpacing: '0px',
  borderRadius: '8px',
  buttonRadius: '8px',
  cardRadius: '12px',
  border: '#79747e',
  sectionPadding: '24px',
  contentAlignment: 'left',
  shadowSoft: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowStrong: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  transitionSpeed: '200ms',
};

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await idb.get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idb.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idb.del(name);
  },
};

export const useAppStore = create<AppState>()(
  temporal(
    persist(
      (set) => ({
      templates: [],
      activeTemplateId: "",
      
      presentations: [],
      activePresentationId: null,
      
      createTemplate: (name, design) => {
        const id = `t-${Date.now()}`;
        set((state) => {
          // Initialize new templates with the full set of high-fidelity default layouts
          const initialLayouts = DEFAULT_LAYOUTS.map(l => ({
            ...l,
            id: `${l.id}-${Date.now()}` // Ensure unique IDs for this template instance
          }));
          
          const newTemplate: SlideTemplate = {
            id,
            name,
            designConfig: { ...DEFAULT_DESIGN, ...design },
            layouts: initialLayouts
          };
          return { templates: [...state.templates, newTemplate], activeTemplateId: id };
        });
        return id;
      },
      
      deleteTemplate: (id) => set((state) => {
        const template = state.templates.find(t => t.id === id);
        if (template?.isDefault) {
          state.addToast("Default templates cannot be deleted.", "error");
          return state;
        }
        const newTemplates = state.templates.filter(t => t.id !== id);
        const newActiveId = state.activeTemplateId === id 
          ? (newTemplates.length > 0 ? newTemplates[0].id : "") 
          : state.activeTemplateId;
        return { templates: newTemplates, activeTemplateId: newActiveId };
      }),
      
      renameTemplate: (id, name) => set((state) => {
        const template = state.templates.find(t => t.id === id);
        if (template?.isDefault) return state;
        return {
          templates: state.templates.map(t => t.id === id ? { ...t, name } : t)
        };
      }),

      duplicateTemplate: (id) => set((state) => {
        const template = state.templates.find(t => t.id === id);
        if (!template) return state;
        const newTemplate: SlideTemplate = {
          ...template,
          id: `t-${Date.now()}`,
          name: `${template.name} (Copy)`
        };
        return { templates: [...state.templates, newTemplate] };
      }),
      
      setActiveTemplate: (id) => set({ activeTemplateId: id }),
      
      updateActiveTemplateDesign: (config) => set((state) => ({
        templates: state.templates.map(t => 
          t.id === state.activeTemplateId 
            ? { ...t, designConfig: { ...t.designConfig, ...config } }
            : t
        )
      })),
      
      addLayoutToActiveTemplate: (layout) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === state.activeTemplateId
            ? { ...t, layouts: [...t.layouts, layout] }
            : t
        )
      })),
      
      updateLayoutInActiveTemplate: (layoutId, updates) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === state.activeTemplateId
            ? { ...t, layouts: t.layouts.map(l => l.id === layoutId ? { ...l, ...updates } : l) }
            : t
        )
      })),
      
      updateLayoutInTemplate: (templateId, layoutId, updates) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === templateId
            ? { ...t, layouts: t.layouts.map(l => l.id === layoutId ? { ...l, ...updates } : l) }
            : t
        )
      })),
      
      renameLayoutInActiveTemplate: (layoutId, name) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === state.activeTemplateId
            ? { ...t, layouts: t.layouts.map(l => l.id === layoutId ? { ...l, name } : l) }
            : t
        )
      })),
      
      removeLayoutFromActiveTemplate: (layoutId) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === state.activeTemplateId && t.layouts.length > 1
            ? { ...t, layouts: t.layouts.filter(l => l.id !== layoutId) }
            : t
        )
      })),

      duplicateLayoutInActiveTemplate: (layoutId) => set((state) => ({
        templates: state.templates.map(t => {
          if (t.id !== state.activeTemplateId) return t;
          const layoutIndex = t.layouts.findIndex(l => l.id === layoutId);
          if (layoutIndex === -1) return t;
          const layout = t.layouts[layoutIndex];
          const newLayout: LayoutDef = {
            ...layout,
            id: `l-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: `${layout.name} (Copy)`
          };
          const newLayouts = [...t.layouts];
          newLayouts.splice(layoutIndex + 1, 0, newLayout);
          return { ...t, layouts: newLayouts };
        })
      })),

      moveLayoutInActiveTemplate: (layoutId, direction) => set((state) => ({
        templates: state.templates.map(t => {
          if (t.id !== state.activeTemplateId) return t;
          const layoutIndex = t.layouts.findIndex(l => l.id === layoutId);
          if (layoutIndex === -1) return t;
          const newLayouts = [...t.layouts];
          const targetIndex = direction === 'up' ? layoutIndex - 1 : layoutIndex + 1;
          if (targetIndex < 0 || targetIndex >= newLayouts.length) return t;
          [newLayouts[layoutIndex], newLayouts[targetIndex]] = [newLayouts[targetIndex], newLayouts[layoutIndex]];
          return { ...t, layouts: newLayouts };
        })
      })),

      reorderLayoutsInActiveTemplate: (layouts) => set((state) => ({
        templates: state.templates.map(t =>
          t.id === state.activeTemplateId ? { ...t, layouts } : t
        )
      })),

      createPresentation: (name, templateId) => {
        const id = `p-${Date.now()}`;
        set((state) => {
          const newPresentation: Presentation = {
            id,
            name,
            templateId,

            slides: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          return { presentations: [...state.presentations, newPresentation], activePresentationId: id };
        });
        return id;
      },
      
      deletePresentation: (id) => set((state) => {
        const newPresentations = state.presentations.filter(p => p.id !== id);
        return { 
          presentations: newPresentations, 
          activePresentationId: state.activePresentationId === id ? null : state.activePresentationId 
        };
      }),
      
      setActivePresentation: (id) => set({ activePresentationId: id }),
      
      renamePresentation: (id, name) => set((state) => ({
        presentations: state.presentations.map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p)
      })),
      
      setPresentationTemplate: (id, templateId) => set((state) => ({
        presentations: state.presentations.map(p => p.id === id ? { ...p, templateId, updatedAt: Date.now() } : p)
      })),

      importTemplate: (template) => set((state) => {
        // Ensure ID is unique if it already exists
        const exists = state.templates.find(t => t.id === template.id);
        const newTemplate = exists 
          ? { ...template, id: `t-${Date.now()}`, name: `${template.name} (Imported)` }
          : template;
        return { templates: [...state.templates, newTemplate], activeTemplateId: newTemplate.id };
      }),

      importPresentation: (presentation) => set((state) => {
        const exists = state.presentations.find(p => p.id === presentation.id);
        const newPresentation = exists
          ? { ...presentation, id: `p-${Date.now()}`, name: `${presentation.name} (Imported)`, updatedAt: Date.now() }
          : presentation;
        return { presentations: [...state.presentations, newPresentation], activePresentationId: newPresentation.id };
      }),

      setSlides: (slides) => set((state) => ({ 
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId ? { ...p, slides, updatedAt: Date.now() } : p
        )
      })),
      updateSlideContent: (id, content) => set((state) => ({
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId 
            ? { ...p, slides: p.slides.map(s => s.id === id ? { ...s, content } : s), updatedAt: Date.now() }
            : p
        )
      })),
      updateSlideLayout: (slideId, layoutId) => set((state) => ({
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId 
            ? { ...p, slides: p.slides.map(s => s.id === slideId ? { ...s, layoutId } : s), updatedAt: Date.now() }
            : p
        )
      })),
      addSlide: (slide) => set((state) => ({ 
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId ? { ...p, slides: [...p.slides, slide], updatedAt: Date.now() } : p
        )
      })),
      removeSlide: (id) => set((state) => ({ 
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId ? { ...p, slides: p.slides.filter(s => s.id !== id), updatedAt: Date.now() } : p
        )
      })),
      duplicateSlideInActivePresentation: (slideId) => set((state) => ({
        presentations: state.presentations.map(p => {
          if (p.id !== state.activePresentationId) return p;
          const slideIndex = p.slides.findIndex(s => s.id === slideId);
          if (slideIndex === -1) return p;
          const slide = p.slides[slideIndex];
          const newSlide: SlideData = {
            ...slide,
            id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`
          };
          const newSlides = [...p.slides];
          newSlides.splice(slideIndex + 1, 0, newSlide);
          return { ...p, slides: newSlides, updatedAt: Date.now() };
        })
      })),
      moveSlideInActivePresentation: (slideId, direction) => set((state) => ({
        presentations: state.presentations.map(p => {
          if (p.id !== state.activePresentationId) return p;
          const slideIndex = p.slides.findIndex(s => s.id === slideId);
          if (slideIndex === -1) return p;
          const newSlides = [...p.slides];
          const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
          if (targetIndex < 0 || targetIndex >= newSlides.length) return p;
          [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]];
          return { ...p, slides: newSlides, updatedAt: Date.now() };
        })
      })),
      updateTemplateDesign: (templateId: string, config) => set((state) => ({
        templates: state.templates.map(t => 
          t.id === templateId ? { ...t, designConfig: { ...t.designConfig, ...config } } : t
        )
      })),
      updateSlideThumbnail: (slideId, thumbnail) => set((state) => ({
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId 
            ? { ...p, slides: p.slides.map(s => s.id === slideId ? { ...s, thumbnail } : s) }
            : p
        )
      })),
      updateSlideCode: (slideId, code) => set((state) => ({
        presentations: state.presentations.map(p => 
          p.id === state.activePresentationId 
            ? { ...p, slides: p.slides.map(s => s.id === slideId ? { ...s, code } : s), updatedAt: Date.now() }
            : p
        )
      })),

      loadDefaultTemplatesFromAssets: () => {
        try {
          const assetTemplates = import.meta.glob('../assets/templates/*.json', { eager: true });
          const loadedTemplates: SlideTemplate[] = Object.values(assetTemplates).map((module: any) => ({
            ...(module.default || module),
            isDefault: true
          }));

          set((state) => {
            const existingIds = new Set(state.templates.map(t => t.id));
            const newTemplates = loadedTemplates.filter(t => !existingIds.has(t.id));
            if (newTemplates.length === 0) return state;
            return { templates: [...state.templates, ...newTemplates] };
          });
        } catch (e) {
          console.error("Failed to load default templates from assets:", e);
        }
      },

      toasts: [],
      addToast: (message, type = 'info') => set((state) => {
        const id = Math.random().toString(36).substring(2, 9);
        // Auto remove toast after 5 seconds
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        }, 5000);
        return { toasts: [...state.toasts, { id, message, type }] };
      }),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state })
    }),

    {
      name: 'domino-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, ...rest } = state;
        return rest;
      },
    }
    ),
    {
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, toasts, ...rest } = state;
        return rest;
      }
    }
  )
);

// --- Editor Session Store (Isolated History) ---

export interface EditorState {
  code: string;
  json: string;
  setCode: (code: string) => void;
  setJson: (json: string) => void;
  reset: (code: string, json: string) => void;
}

export const useEditorStore = create<EditorState>()(
  temporal((set) => ({
    code: "",
    json: "",
    setCode: (code) => set({ code }),
    setJson: (json) => set({ json }),
    reset: (code, json) => {
      set({ code, json });
    },
  }))
);

// Start with history tracking paused (only enable in Builder components)
if (typeof window !== 'undefined') {
  useAppStore.temporal.getState().pause();
  useEditorStore.temporal.getState().pause();
}
