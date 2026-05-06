import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as idb from 'idb-keyval';

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
  // Visual Identity
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  surfaceContrast: string;
  
  // Typography
  textPrimary: string;
  textSecondary: string;
  fontFamily: string;
  headingFont: string;
  headingWeight: string;
  headingSize: string;
  bodySize: string;
  letterSpacing: string;
  
  // Layout & Style
  borderRadius: string;
  buttonRadius: string;
  cardRadius: string;
  border: string;
  sectionPadding: string;
  contentAlignment: 'left' | 'center';
  
  // Depth & Effects
  shadowSoft: string;
  shadowStrong: string;
  transitionSpeed: string;
}

export interface SlideTemplate {
  id: string;
  name: string;
  designConfig: DesignConfig;
  layouts: LayoutDef[];
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
  renameLayoutInActiveTemplate: (layoutId: string, name: string) => void;
  removeLayoutFromActiveTemplate: (layoutId: string) => void;

  createPresentation: (name: string, templateId: string) => string;
  deletePresentation: (id: string) => void;
  setActivePresentation: (id: string | null) => void;
  renamePresentation: (id: string, name: string) => void;
  setPresentationTemplate: (id: string, templateId: string) => void;

  importTemplate: (template: SlideTemplate) => void;

  setSlides: (slides: SlideData[]) => void;
  updateSlideContent: (id: string, content: any) => void;
  updateSlideLayout: (slideId: string, layoutId: string) => void;
  addSlide: (slide: SlideData) => void;
  removeSlide: (slideId: string) => void;
  updateTemplateDesign: (templateId: string, config: Partial<DesignConfig>) => void;
  
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const DEFAULT_LAYOUTS: LayoutDef[] = [
  {
    id: "l-title",
    name: "Standard Title",
    variant: "title",
    code: `<div class="flex flex-col items-center justify-center h-full w-full bg-lumina-bg p-12 text-center rounded-lumina">
  <h1 class="text-6xl font-black font-display text-lumina-primary mb-6 drop-shadow-sm">{{title}}</h1>
  {{#if subtitle}}
    <h2 class="text-3xl font-medium text-lumina-text-secondary">{{subtitle}}</h2>
  {{/if}}
</div>`
  },
  {
    id: "l-content",
    name: "Bullet Content",
    variant: "content",
    code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-16 rounded-lumina">
  <h2 class="text-5xl font-bold font-display text-lumina-text-primary mb-10 border-b-4 border-lumina-secondary pb-4 inline-block font-display">{{title}}</h2>
  <ul class="list-disc list-inside text-3xl text-lumina-text-secondary space-y-6 font-medium font-sans">
    {{#each points}}
      <li>{{this}}</li>
    {{/each}}
  </ul>
</div>`
  },
  {
    id: "l-image-text",
    name: "Image + Text",
    variant: "image-text",
    code: `<div class="flex h-full w-full bg-lumina-surface rounded-lumina overflow-hidden">
  <div class="w-1/2 p-16 flex flex-col justify-center">
    <h2 class="text-5xl font-bold font-display text-lumina-primary mb-8">{{title}}</h2>
    <p class="text-2xl text-lumina-text-secondary leading-relaxed font-medium">{{description}}</p>
  </div>
  <div class="w-1/2 flex items-center justify-center p-8 bg-lumina-bg">
    <div class="relative w-full h-full flex flex-col justify-center overflow-hidden rounded-lumina shadow-[0_8px_20px_rgba(28,27,27,0.1)] group" data-image-key="image">
      {{#if image}}
        <img src="{{image}}" alt="Slide image" class="w-full h-full object-cover" />
      {{else}}
        <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 border-4 border-dashed border-gray-300 rounded-lumina">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="text-2xl font-bold">Image Placeholder</span>
        </div>
      {{/if}}
    </div>
  </div>
</div>`
  },
  {
    id: "l-comparison",
    name: "2-Column Comparison",
    variant: "comparison",
    code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-12 rounded-lumina">
  <h2 class="text-4xl font-bold font-display text-center text-lumina-text-primary mb-12">{{title}}</h2>
  <div class="flex flex-1 gap-12">
    <div class="flex-1 bg-lumina-bg p-8 rounded-lumina shadow-sm border border-lumina-border">
      <h3 class="text-3xl font-bold font-display text-lumina-primary mb-6">{{leftTitle}}</h3>
      <ul class="list-disc list-inside space-y-4 text-2xl text-lumina-text-secondary font-medium">
        {{#each leftPoints}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
    <div class="flex-1 bg-lumina-bg p-8 rounded-lumina shadow-sm border border-lumina-border">
      <h3 class="text-3xl font-bold font-display text-lumina-secondary mb-6">{{rightTitle}}</h3>
      <ul class="list-disc list-inside space-y-4 text-2xl text-lumina-text-secondary font-medium">
        {{#each rightPoints}}<li>{{this}}</li>{{/each}}
      </ul>
    </div>
  </div>
</div>`
  },
  {
    id: "l-divider",
    name: "Section Divider",
    variant: "divider",
    code: `<div class="flex items-center justify-center h-full w-full bg-lumina-primary text-white p-16 rounded-lumina">
  <div class="border-t-8 border-lumina-secondary pt-8">
    <h2 class="text-6xl font-black font-display uppercase tracking-wider drop-shadow-md">{{section}}</h2>
  </div>
</div>`
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

const DEFAULT_DESIGN: DesignConfig = {
  primary: '#b20112',
  primaryHover: '#d62828',
  secondary: '#fe6247',
  accent: '#f4f1f1',
  bg: '#fcf9f8',
  surface: '#ffffff',
  surfaceContrast: '#f3efee',
  textPrimary: '#1c1b1b',
  textSecondary: '#5c403d',
  fontFamily: 'Inter',
  headingFont: 'Inter',
  headingWeight: '900',
  headingSize: '4rem',
  bodySize: '1.25rem',
  letterSpacing: '-0.02em',
  borderRadius: '0.75rem',
  buttonRadius: '0.5rem',
  cardRadius: '1rem',
  border: '#eae7e7',
  sectionPadding: '5rem',
  contentAlignment: 'center',
  shadowSoft: '0 4px 20px rgba(0,0,0,0.05)',
  shadowStrong: '0 10px 40px rgba(0,0,0,0.1)',
  transitionSpeed: '300ms',
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
  persist(
    (set) => ({
      templates: [
        {
          id: "t-default",
          name: "Lumina Velocity",
          designConfig: DEFAULT_DESIGN,
          layouts: DEFAULT_LAYOUTS
        }
      ],
      activeTemplateId: "t-default",
      
      presentations: [
        {
          id: "p-default",
          name: "My First Presentation",
          templateId: "t-default",

          slides: DEFAULT_SLIDES,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      activePresentationId: "p-default",
      
      createTemplate: (name, design) => {
        const id = `t-${Date.now()}`;
        set((state) => {
          // A "clean" start usually means 1-2 basic layouts instead of the full sample set
          const minimalLayouts: LayoutDef[] = [
             {
               id: `l-${Date.now()}-title`,
               name: "Main Title",
               variant: "title",
               code: `<div class="flex flex-col items-center justify-center h-full w-full bg-lumina-bg p-20 text-center rounded-lumina">
  <h1 class="text-7xl font-black text-lumina-primary mb-6">{{title}}</h1>
  <div class="w-24 h-2 bg-lumina-secondary mb-8"></div>
  <h2 class="text-3xl font-medium text-lumina-text-secondary">{{subtitle}}</h2>
</div>`
             },
             {
               id: `l-${Date.now()}-content`,
               name: "Standard Content",
               variant: "content",
               code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-20 rounded-lumina">
  <h2 class="text-5xl font-bold text-lumina-text-primary mb-12 flex items-center gap-4">
    <span class="w-3 h-12 bg-lumina-primary rounded-full"></span>
    {{title}}
  </h2>
  <div class="text-3xl text-lumina-text-secondary leading-relaxed">
    {{description}}
  </div>
</div>`
             }
          ];
          
          const newTemplate: SlideTemplate = {
            id,
            name,
            designConfig: { ...DEFAULT_DESIGN, ...design },
            layouts: minimalLayouts
          };
          return { templates: [...state.templates, newTemplate], activeTemplateId: id };
        });
        return id;
      },
      
      deleteTemplate: (id) => set((state) => {
        if (state.templates.length === 1) return state;
        const newTemplates = state.templates.filter(t => t.id !== id);
        const newActiveId = state.activeTemplateId === id ? newTemplates[0].id : state.activeTemplateId;
        return { templates: newTemplates, activeTemplateId: newActiveId };
      }),
      
      renameTemplate: (id, name) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, name } : t)
      })),

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
      updateTemplateDesign: (templateId: string, config) => set((state) => ({
        templates: state.templates.map(t => 
          t.id === templateId ? { ...t, designConfig: { ...t.designConfig, ...config } } : t
        )
      })),

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
      }))
    }),
    {
      name: 'pitchgen-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
