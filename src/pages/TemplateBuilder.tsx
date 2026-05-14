import React, { useState, useMemo, useRef, useEffect } from "react";
import { Reorder, useDragControls } from "motion/react";
import Editor from "../components/LazyEditor";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore, useEditorStore, useThemeStore, LayoutDef, LayoutVariant, SlideTemplate, DEFAULT_DESIGN } from "../store";
import { SlidePreview } from "../components/SlidePreview";
import { Button, Input, Textarea } from "../components/ui";
import { 
  Plus, 
  GripVertical,
  Trash2, 
  Download, 
  Palette, 
  Sparkles, 
  Settings2, 
  Play, 
  Code2, 
  LayoutTemplate, 
  Edit2, 
  Check, 
  Copy, 
  CircleAlert,
  X,
  Loader2,
  Mic,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2
} from 'lucide-react';
import { askAiForLayoutCode, buildLayoutPrompt, askAiForFullTemplate, buildFullTemplatePrompt, PromptSettings, askAiForDesignConfig, buildDesignConfigPrompt } from "../lib/gemini";
import { cn, copyToClipboard } from "../lib/utils";
import Handlebars from "handlebars";
import { PromptSettingsForm, PRESET_PROMPTS } from "../components/PromptSettingsUI";
import { GoogleFontLoader, POPULAR_FONTS } from "../lib/typography";
import { ThemeSettingsPanel } from "../components/design-system/ThemeSettingsPanel";
import { FullScreenModal } from "../components/layout/FullScreenModal";
import { ThemeShowcase } from "../components/design-system/ThemeShowcase";
import { ThemePreviewCanvas } from "../components/design-system/ThemePreviewCanvas";
import { AIAssistantPanel } from "../components/ai/AIAssistantPanel";
import { PageHeader } from "../components/layout/PageHeader";

import { SlideShowcase } from "../components/SlideShowcase";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useStore } from 'zustand';




const SAMPLE_DATA: Record<LayoutVariant, any> = {
  title: { 
    title: "The Future of Design Systems", 
    subtitle: "Scaling consistency and precision with Material 3" 
  },
  content: { 
    title: "Key Strategic Pillars", 
    points: [
      "Modular Architecture for infinite scalability",
      "Dynamic Token Propagation across platforms",
      "High-Fidelity Prototyping in real-time",
      "Accessibility-First Component Engineering"
    ] 
  },
  "image-text": { 
    title: "Visual Intelligence", 
    description: "Our new algorithmic layout engine intelligently balances negative space and typography to create stunning, readable slides automatically.", 
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" 
  },
  comparison: { 
    title: "Efficiency Gains", 
    leftTitle: "Legacy Workflow", 
    leftPoints: ["Manual CSS updates", "Disconnected design files", "Slow handoff process"], 
    rightTitle: "Lumina Engine", 
    rightPoints: ["Token-based styling", "Live synced layouts", "Instant AI generation", "Standardized M3 components"] 
  },
  divider: { 
    section: "Technical Deep-Dive",
    description: "Exploring the underlying architecture of our rendering pipeline."
  }
};


const ReorderableLayout = ({ l, selectedLayoutId, setSelectedLayoutId, setMobileTab, editingLayoutId, editingLayoutName, setEditingLayoutName, renameLayoutInActiveTemplate, setEditingLayoutId, workingCode, duplicateLayoutInActiveTemplate, setLayoutToDelete, layouts, isDefaultTemplate, handleAppAction }: any) => {

  const controls = useDragControls();
  
  return (
    <Reorder.Item 
      value={l}
      dragListener={false}
      dragControls={controls}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      whileDrag={{ 
        scale: 1.05, 
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)",
        zIndex: 50,
      }}
      onClick={() => {
        setSelectedLayoutId(l.id);
        if (window.innerWidth < 768) setMobileTab('preview');
      }}
      className={cn(
        "px-4 py-3 text-sm rounded-xl cursor-pointer border flex items-center justify-between group select-none",
        selectedLayoutId === l.id 
          ? "bg-[#D62828]/10 border-[#D62828] text-white font-bold" 
          : "bg-transparent border-transparent text-[#85858b] hover:bg-[#2d2d30]/50 hover:text-white"
      )}
    >
      {editingLayoutId === l.id ? (
        <input
          autoFocus
          value={editingLayoutName}
          onChange={(e) => setEditingLayoutName(e.target.value)}
          onBlur={() => {
             if (editingLayoutName.trim() && editingLayoutName !== l.name) {
               handleAppAction(() => renameLayoutInActiveTemplate(l.id, editingLayoutName.trim()));
             }
             setEditingLayoutId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
               if (editingLayoutName.trim() && editingLayoutName !== l.name) {
                 handleAppAction(() => renameLayoutInActiveTemplate(l.id, editingLayoutName.trim()));
               }
               setEditingLayoutId(null);
            } else if (e.key === 'Escape') {
               setEditingLayoutId(null);
            }
          }}
          className="bg-transparent border-none outline-none text-white w-full"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 truncate">
            <div 
              onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
              className="p-1.5 -ml-1.5 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center justify-center shrink-0"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </div>
            <span className="truncate">{l.name}</span>
          </div>
             <div className="flex items-center gap-0.5">
               {selectedLayoutId === l.id && workingCode !== l.code && <div className="w-2 h-2 rounded-full bg-[#fe6247] mr-1" />}
               {!isDefaultTemplate && (
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleAppAction(() => duplicateLayoutInActiveTemplate(l.id)); }} className="p-1 hover:text-white" title="Duplicate"><Copy size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditingLayoutId(l.id); setEditingLayoutName(l.name); }} className="p-1 hover:text-white" title="Rename"><Edit2 size={12} /></button>
                {layouts.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); handleAppAction(() => setLayoutToDelete(l.id)); }} className="p-1 hover:text-[#D62828]" title="Delete"><Trash2 size={12} /></button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Reorder.Item>
  );
};

export function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, addLayoutToActiveTemplate, updateLayoutInActiveTemplate, renameLayoutInActiveTemplate, setActiveTemplate, removeLayoutFromActiveTemplate, updateActiveTemplateDesign, renameTemplate, duplicateLayoutInActiveTemplate, moveLayoutInActiveTemplate, reorderLayoutsInActiveTemplate } = useAppStore();
  const { undo, redo, pastStates, futureStates } = useStore(useAppStore.temporal, (state) => state);
  const { 
    code: workingCode, 
    json: workingJson, 
    setCode: setWorkingCode, 
    setJson: setWorkingJson, 
    reset: resetEditor 
  } = useEditorStore();
  const { undo: editorUndo, redo: editorRedo, pastStates: editorPast, futureStates: editorFuture } = useStore(useEditorStore.temporal, (state) => state);
  
  const { config: themeConfig, setConfig: setThemeConfig, updateConfig: updateThemeConfig, reset: resetTheme } = useThemeStore();
  const { undo: themeUndo, redo: themeRedo, pastStates: themePast, futureStates: themeFuture } = useStore(useThemeStore.temporal, (state) => state);

  const activeTemplate = useMemo(() => templates.find(t => t.id === id), [templates, id]);
  const layouts = activeTemplate?.layouts || [];
  const designConfig = activeTemplate?.designConfig || (templates.length > 0 ? templates[0].designConfig : DEFAULT_DESIGN);

  const [localCode, setLocalCode] = useState(workingCode);
  const [localJson, setLocalJson] = useState(workingJson);
  const codeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const jsonDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<'app' | 'editor'>('editor');
  
  const [isEditingTemplateName, setIsEditingTemplateName] = useState(false);
  const [templateName, setTemplateName] = useState(activeTemplate?.name || "");
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(layouts[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'hbs' | 'json'>('hbs');
  const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [editingLayoutName, setEditingLayoutName] = useState<string>("");
  const [builderMode, setBuilderMode] = useState<'individual' | 'full'>('individual');
  const [aiMode, setAiMode] = useState<'ai' | 'prompt'>('ai');
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [fullPrompt, setFullPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [themeEntryMode, setThemeEntryMode] = useState<'ai' | 'manual'>('manual');
  const [themeAiPrompt, setThemeAiPrompt] = useState("");
  const [themeAiResponse, setThemeAiResponse] = useState("");
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: "",
    detail: ""
  });
  const [themeSidebarWidth, setThemeSidebarWidth] = useState(450);
  const [showAiOnMobile, setShowAiOnMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'layouts' | 'preview' | 'code'>('preview');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSwitchingLayout, setIsSwitchingLayout] = useState(false);
  const isResizingThemeSidebar = useRef(false);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const previewRef = useRef<any>(null);

  const handleAppAction = (action: () => void) => {
    lastActionRef.current = 'app';
    action();
  };

  const handleUndo = () => {
    if (lastActionRef.current === 'editor') {
      if (editorPast.length > 0) {
        editorUndo();
      } else if (pastStates.length > 0) {
        lastActionRef.current = 'app';
        undo();
      }
    } else {
      if (pastStates.length > 0) {
        undo();
      } else if (editorPast.length > 0) {
        lastActionRef.current = 'editor';
        editorUndo();
      }
    }
  };

  const handleRedo = () => {
    if (lastActionRef.current === 'editor') {
      if (editorFuture.length > 0) {
        editorRedo();
      } else if (futureStates.length > 0) {
        lastActionRef.current = 'app';
        redo();
      }
    } else {
      if (futureStates.length > 0) {
        redo();
      } else if (editorFuture.length > 0) {
        lastActionRef.current = 'editor';
        editorRedo();
      }
    }
  };

  const handleEditorCodeChange = (val: string) => {
    setLocalCode(val);
    lastActionRef.current = 'editor';
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
    codeDebounceRef.current = setTimeout(() => {
      setWorkingCode(val);
    }, 1000);
  };

  const handleEditorJsonChange = (val: string) => {
    setLocalJson(val);
    lastActionRef.current = 'editor';
    if (jsonDebounceRef.current) clearTimeout(jsonDebounceRef.current);
    jsonDebounceRef.current = setTimeout(() => {
      setWorkingJson(val);
    }, 1000);
  };

  useEffect(() => {
    if (activeTemplate) {
      setTemplateName(activeTemplate.name);
    }
  }, [activeTemplate?.name]);
  
  useEffect(() => {
    setLocalCode(workingCode);
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current);
  }, [workingCode]);

  useEffect(() => {
    setLocalJson(workingJson);
    if (jsonDebounceRef.current) clearTimeout(jsonDebounceRef.current);
  }, [workingJson]);

  useEffect(() => {
    // Resume history tracking when entering the template builder
    useAppStore.temporal.getState().resume();
    // Clear history so we start fresh for this specific template
    useAppStore.temporal.getState().clear();
    
    return () => {
      // Pause history tracking when leaving
      useAppStore.temporal.getState().pause();
    };
  }, [id]);

  useEffect(() => {
    if (showThemeEditor && activeTemplate) {
      // Sync template design to theme store when opening
      resetTheme(activeTemplate.designConfig);
      useThemeStore.temporal.getState().clear();
      useThemeStore.temporal.getState().resume();
      
      // Pause other histories to avoid cross-contamination
      useAppStore.temporal.getState().pause();
      useEditorStore.temporal.getState().pause();
    } else if (!showThemeEditor) {
      useThemeStore.temporal.getState().pause();
      // Resume app history when closing theme editor
      useAppStore.temporal.getState().resume();
      useEditorStore.temporal.getState().resume();
    }
  }, [showThemeEditor, activeTemplate, resetTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable ||
                      target.closest('.monaco-editor');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (isInput) return;
          e.preventDefault();
          if (showThemeEditor) themeRedo();
          else handleRedo();
        } else {
          if (isInput) return;
          e.preventDefault();
          if (showThemeEditor) themeUndo();
          else handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (isInput) return;
        e.preventDefault();
        if (showThemeEditor) themeRedo();
        else handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, showThemeEditor, themeUndo, themeRedo]);

  useEffect(() => {
    if (id && activeTemplate) {
      setActiveTemplate(id);
    }
  }, [id, activeTemplate, setActiveTemplate]);

  useEffect(() => {
    if (!activeTemplate) {
       navigate("/templates");
    }
  }, [activeTemplate, navigate]);


  const handleThemeAiGenerate = async () => {
    if (!themeAiPrompt.trim()) return;
    setIsGeneratingTheme(true);
    try {
      const config = await askAiForDesignConfig(themeAiPrompt);
      if (config) {
        updateThemeConfig(config);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleApplyThemeAiResponse = () => {
    try {
      const jsonMatch = themeAiResponse.match(/<json>([\s\S]*?)<\/json>/i) || themeAiResponse.match(/```json\n([\s\S]*?)```/i);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : themeAiResponse.trim();
      const config = JSON.parse(jsonStr);
      if (config) {
        updateThemeConfig(config);
        setThemeAiResponse("");
      }
    } catch (err) {
      alert("Invalid JSON response.");
    }
  };
  
  const handleApplyLayoutAiResponse = () => {
    try {
      const response = aiResponse.trim();
      let code = "";
      let json = "";

      // 1. Try to extract from <slide> or <code> tags
      const slideMatch = response.match(/<slide>([\s\S]*?)<\/slide>/i) || response.match(/<code>([\s\S]*?)<\/code>/i);
      if (slideMatch) {
        code = slideMatch[1].trim();
        // Remove any markdown code block wrappers if they exist
        code = code.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
      }

      // 2. Try to extract from <json> or <data> tags
      const dataMatch = response.match(/<json>([\s\S]*?)<\/json>/i) || response.match(/<data>([\s\S]*?)<\/data>/i) || response.match(/```json\n([\s\S]*?)```/i);
      if (dataMatch) {
        json = dataMatch[1].trim();
      }

      // 3. Fallback: If no tags, try to parse the whole thing as a JSON object with {code, json}
      if (!code && !json) {
        try {
          const parsed = JSON.parse(response);
          if (parsed.code) code = parsed.code;
          if (parsed.json) json = typeof parsed.json === 'string' ? parsed.json : JSON.stringify(parsed.json, null, 2);
        } catch (e) {
          // Not a JSON object, just take the raw response as code if it looks like HTML
          if (response.includes('<')) code = response;
        }
      }

      if (code) setWorkingCode(code);
      if (json) setWorkingJson(json);
      
      if (code || json) {
        setAiResponse("");
      } else {
        alert("Could not find any valid code or JSON in the response.");
      }
    } catch (err) {
      alert("Error applying AI response: " + err);
    }
  };


  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextLayout();
    } else if (isRightSwipe) {
      handlePrevLayout();
    }
  };

  const handleNextLayout = () => {
    const currentIndex = layouts.findIndex(l => l.id === selectedLayoutId);
    if (currentIndex < layouts.length - 1) {
      triggerSwitch(layouts[currentIndex + 1].id);
    } else {
      triggerSwitch(layouts[0].id);
    }
  };

  const handlePrevLayout = () => {
    const currentIndex = layouts.findIndex(l => l.id === selectedLayoutId);
    if (currentIndex > 0) {
      triggerSwitch(layouts[currentIndex - 1].id);
    } else {
      triggerSwitch(layouts[layouts.length - 1].id);
    }
  };

  const triggerSwitch = (id: string) => {
    setIsSwitchingLayout(true);
    setSelectedLayoutId(id);
    // Micro-delay to ensure SlidePreview gets the loading state before we release it
    // SlidePreview will then hold isInternalLoading until SLIDE_READY
    setTimeout(() => setIsSwitchingLayout(false), 50);
  };

  const startResizingTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingThemeSidebar.current = true;
    document.addEventListener('mousemove', handleThemeResize);
    document.addEventListener('mouseup', stopThemeResize);
    document.body.style.cursor = 'col-resize';
  };

  const stopThemeResize = () => {
    isResizingThemeSidebar.current = false;
    document.removeEventListener('mousemove', handleThemeResize);
    document.removeEventListener('mouseup', stopThemeResize);
    document.body.style.cursor = '';
  };

  const handleThemeResize = (e: MouseEvent) => {
    if (!isResizingThemeSidebar.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 300 && newWidth <= 800) {
      setThemeSidebarWidth(newWidth);
    }
  };

  React.useEffect(() => {
    if (layouts.length > 0 && !layouts.find(l => l.id === selectedLayoutId)) {
      setSelectedLayoutId(layouts[0].id);
    }
  }, [layouts, selectedLayoutId]);

  const activeLayout = useMemo(() => layouts.find(l => l.id === selectedLayoutId) || layouts[0], [layouts, selectedLayoutId]);

  React.useEffect(() => {
    if (activeLayout) {
      // Cancel any pending debounce timers from the previous layout
      if (codeDebounceRef.current) { clearTimeout(codeDebounceRef.current); codeDebounceRef.current = null; }
      if (jsonDebounceRef.current) { clearTimeout(jsonDebounceRef.current); jsonDebounceRef.current = null; }

      // Pause history before resetting to avoid recording the reset itself
      useEditorStore.temporal.getState().pause();

      const initialCode = activeLayout.code;
      const initialJson = JSON.stringify(activeLayout.mockData || SAMPLE_DATA[activeLayout.variant] || { title: "Sample" }, null, 2);
      resetEditor(initialCode, initialJson);
      setLocalCode(initialCode);
      setLocalJson(initialJson);

      // Clear history and resume after a microtask to ensure the reset has settled
      queueMicrotask(() => {
        useEditorStore.temporal.getState().clear();
        useEditorStore.temporal.getState().resume();
      });
      setParseError(null);
    }
  }, [activeLayout?.id, activeLayout?.variant]);

  // Debounced check for Handlebars syntax
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (localCode) {
           Handlebars.precompile(localCode);
        }
        setParseError(null);
      } catch (err: any) {
        setParseError(err.message);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localCode]);

  const handleSave = () => {
    if (activeLayout) {
      let parsedMock;
      try {
        parsedMock = JSON.parse(localJson);
      } catch (e) {}

      handleAppAction(() => {
        updateLayoutInActiveTemplate(activeLayout.id, {
          code: localCode,
          mockData: parsedMock || activeLayout.mockData
        });
      });
    }
  };

  const handleExport = () => {
    if (!activeTemplate) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeTemplate, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${activeTemplate.name.replace(/\s+/g, '_').toLowerCase()}_template.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleAddLayout = () => {
    const newId = `l-${Date.now()}`;
    handleAppAction(() => {
      addLayoutToActiveTemplate({
        id: newId,
        name: "New Layout",
        variant: "content",
        code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-lumina-xl">
  <h2 class="text-lumina-primary type-headline-lg mb-lumina-lg border-b-4 border-lumina-primary-container pb-lumina-sm inline-block">{{title}}</h2>
  <div class="text-lumina-on-surface-variant type-body-lg">
    {{description}}
  </div>
</div>`,
        mockData: {
          title: "New Section Title",
          description: "Enter your content description here. This layout is pre-configured with the Lumina design system tokens for perfect visual alignment."
        }
      });
    });
    setSelectedLayoutId(newId);
  };

  // Add refs to track the debounce timers
  const aiDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const fullDeckDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAiGenerate = async () => {
    // 1. Loading Lock: Prevent duplicate requests
    if (!aiPrompt.trim() || !activeLayout || isAiLoading) return;
    
    // 2. Clear existing timer if user triggers again quickly
    if (aiDebounceTimer.current) {
      clearTimeout(aiDebounceTimer.current);
    }

    // 3. Debounce: Wait 750ms before making the API call
    aiDebounceTimer.current = setTimeout(async () => {
      setIsAiLoading(true);
      
      try {
        const { code, json } = await askAiForLayoutCode(aiPrompt, localCode, localJson, promptSettings);
        setWorkingCode(code);
        if (json) {
          setWorkingJson(json);
        }
        setAiPrompt("");
      } catch (e: any) {
        alert("AI Generation failed: " + e.message);
      } finally {
        setIsAiLoading(false);
      }
    }, 750);
  };

  const handleFullDeckGenerate = async () => {
    // 1. Loading Lock: Prevent duplicate requests
    if (!fullPrompt.trim() || isAiLoading) return;
    
    // 2. Clear existing timer
    if (fullDeckDebounceTimer.current) {
      clearTimeout(fullDeckDebounceTimer.current);
    }

    // 3. Debounce: Wait 750ms
    fullDeckDebounceTimer.current = setTimeout(async () => {
      setIsAiLoading(true);
      
      try {
        const simplifiedLayouts = layouts.map(l => ({ id: l.id, name: l.name }));
        const newLayouts = await askAiForFullTemplate(fullPrompt, simplifiedLayouts, promptSettings);
        
            if (newLayouts && newLayouts.length > 0) {
          let firstNewId: string | null = null;
          handleAppAction(() => {
            newLayouts.forEach((nl, index) => {
              const newId = `l-gen-${Date.now()}-${index}`;
              if (index === 0) firstNewId = newId;
              
              addLayoutToActiveTemplate({
                id: newId,
                name: nl.name || `Generated Layout ${index + 1}`,
                variant: nl.variant || "content",
                code: nl.code || "<div>Empty</div>",
                mockData: nl.mockData || undefined
              });
            });
          });
          
          if (firstNewId) setSelectedLayoutId(firstNewId);
          setFullPrompt("");
        } else {
          alert("AI did not return valid layouts array.");
        }
      } catch (e: any) {
        alert("AI Generation failed: " + e.message);
      } finally {
        setIsAiLoading(false);
      }
    }, 750);
  };




  if (!activeTemplate || !activeLayout) {
     return <div className="p-8">Loading...</div>;
  }

  let currentSampleData = activeLayout.mockData || SAMPLE_DATA[activeLayout.variant] || { title: "Sample" };
  try {
    currentSampleData = JSON.parse(localJson);
  } catch(e) {
    // keeping default if invalid JSON
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-gray-200 overflow-hidden relative">
      <GoogleFontLoader fonts={[designConfig.fontFamily, designConfig.headingFont]} />
      
      <PageHeader 
        backTo="/templates"
        title={
          <div className="flex items-center min-w-0">
            {isEditingTemplateName && !activeTemplate.isDefault ? (
              <input 
                autoFocus
                className="bg-transparent border-b border-[#fe6247] outline-none text-white font-bold text-sm md:text-lg w-full max-w-[120px] md:max-w-xs"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onBlur={() => {
                  if (templateName.trim() && templateName !== activeTemplate.name) {
                    handleAppAction(() => renameTemplate(activeTemplate.id, templateName.trim()));
                  }
                  setIsEditingTemplateName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (templateName.trim() && templateName !== activeTemplate.name) {
                      handleAppAction(() => renameTemplate(activeTemplate.id, templateName.trim()));
                    }
                    setIsEditingTemplateName(false);
                  } else if (e.key === 'Escape') {
                    setTemplateName(activeTemplate.name);
                    setIsEditingTemplateName(false);
                  }
                }}
              />
            ) : (
              <h2 
                className={cn(
                  "font-bold text-white text-sm md:text-lg truncate flex items-center gap-2 group max-w-[100px] sm:max-w-xs overflow-hidden text-ellipsis",
                  !activeTemplate.isDefault ? "cursor-pointer hover:text-[#fe6247] transition-colors" : ""
                )}
                onClick={() => !activeTemplate.isDefault && setIsEditingTemplateName(true)}
              >
                {activeTemplate.name}
                {activeTemplate.isDefault ? (
                  <span className="px-1.5 py-0.5 bg-[#D62828]/10 text-[#D62828] text-[8px] font-black uppercase tracking-widest rounded-md border border-[#D62828]/20 shrink-0">
                    System Default
                  </span>
                ) : (
                  <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </h2>
            )}
            {builderMode === 'individual' && (
              <>
                <span className="opacity-50 mx-1 md:mx-2 text-[#85858b]">/</span> 
                <span className="text-[#85858b] truncate text-xs md:text-sm max-w-[80px] md:max-w-none">{activeLayout.name}</span>
              </>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
               <div className="flex items-center mr-2 border border-[#333] rounded-lg overflow-hidden bg-[#1c1c1e]">
                 <button 
                   onClick={() => handleUndo()} 
                   disabled={editorPast.length === 0 && pastStates.length === 0}
                   className="p-1.5 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d2d30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-[#333]"
                   title="Undo (Ctrl+Z)"
                 >
                   <Undo2 size={14} />
                 </button>
                 <button 
                   onClick={() => handleRedo()} 
                   disabled={editorFuture.length === 0 && futureStates.length === 0}
                   className="p-1.5 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d2d30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   title="Redo (Ctrl+Y)"
                 >
                   <Redo2 size={14} />
                 </button>
              </div>
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 border-[#333] hover:bg-[#252526] text-gray-300">
                <Download size={14} /> Export
              </Button>
              <Button onClick={() => setShowThemeEditor(!showThemeEditor)} size="sm" className="gap-2 bg-[#252526] hover:bg-[#2d2d30] text-gray-300 border border-[#333]">
                <Palette size={14} /> Theme
              </Button>
            </div>

            <div className="flex items-center bg-[#111111] rounded-lg p-0.5 border border-[#2d2d30] shrink-0">
               <button 
                 onClick={() => setBuilderMode('individual')} 
                 className={cn("px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-colors", builderMode === 'individual' ? "bg-[#252526] text-white" : "text-gray-500 hover:text-gray-300")}
               >
                 Single
               </button>
               <button 
                 onClick={() => setBuilderMode('full')} 
                 className={cn("px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-colors", builderMode === 'full' ? "bg-[#252526] text-white" : "text-gray-500 hover:text-gray-300")}
               >
                 Full
               </button>
            </div>

            <Button onClick={handleSave} size="sm" className="bg-[#b20112] hover:bg-[#d62828] text-white border-none font-bold">
               Save
            </Button>

            <div className="lg:hidden flex gap-1">
              <button onClick={() => setShowThemeEditor(true)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
                <Palette size={16} />
              </button>
            </div>
          </div>
        }
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {builderMode === 'individual' ? (
          <>
            <div className={cn(
              "w-full md:w-64 border-r border-[#2d2d30] bg-[#161618] flex flex-col shrink-0 transition-transform duration-300",
              "absolute inset-0 z-20 md:relative md:translate-x-0",
              mobileTab === 'layouts' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
              <div className="p-4 md:p-6 pb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#85858b]">Layout Library</span>
                {!activeTemplate.isDefault && (
                  <button onClick={handleAddLayout} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <Reorder.Group 
                axis="y" 
                values={layouts} 
                onReorder={(newLayouts) => handleAppAction(() => reorderLayoutsInActiveTemplate(newLayouts))}
                className="flex-1 overflow-y-auto p-3 space-y-1"
              >
                {layouts.map(l => (
                   <ReorderableLayout 
                     key={l.id}
                     l={l}
                     selectedLayoutId={selectedLayoutId}
                     setSelectedLayoutId={setSelectedLayoutId}
                     setMobileTab={setMobileTab}
                     editingLayoutId={editingLayoutId}
                     editingLayoutName={editingLayoutName}
                     setEditingLayoutName={setEditingLayoutName}
                     renameLayoutInActiveTemplate={renameLayoutInActiveTemplate}
                     setEditingLayoutId={setEditingLayoutId}
                     workingCode={localCode}
                     duplicateLayoutInActiveTemplate={duplicateLayoutInActiveTemplate}
                     setLayoutToDelete={setLayoutToDelete}
                     layouts={layouts}
                     isDefaultTemplate={activeTemplate?.isDefault} handleAppAction={handleAppAction}
                   />
                ))}
              </Reorder.Group>
              </div>

            <div className="flex-1 flex flex-col bg-[#111111] relative overflow-hidden">
              <div className="md:hidden flex border-b border-[#2d2d30] bg-[#161618]">
                <button onClick={() => setMobileTab('preview')} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest", mobileTab === 'preview' ? "text-[#D62828] border-b-2 border-[#D62828]" : "text-gray-500")}>Preview</button>
                <button onClick={() => setMobileTab('code')} className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest", mobileTab === 'code' ? "text-[#D62828] border-b-2 border-[#D62828]" : "text-gray-500")}>Editor</button>
              </div>

              <div className={cn(
                "flex-1 flex flex-col lg:flex-row overflow-hidden relative",
                "pb-16 md:pb-0"
              )}>
                <div className={cn(
                  "flex flex-col flex-1 lg:flex-none lg:w-1/2 min-w-0 border-b lg:border-b-0 lg:border-r border-[#2d2d30] bg-[#1e1e1e] relative",
                  "absolute inset-0 z-10 lg:relative lg:translate-x-0",
                  mobileTab === 'code' ? "translate-x-0" : "translate-x-full lg:translate-x-0"
                )}>
                   <div className="h-10 md:h-12 bg-[#1a1a1b] border-b border-[#2d2d30] text-[10px] md:text-xs text-[#85858b] flex items-center shrink-0">
                      <div onClick={() => setActiveTab('hbs')} className={cn("px-4 md:px-5 border-r border-[#2d2d30] h-full flex items-center gap-2 font-mono cursor-pointer transition-colors", activeTab === 'hbs' ? "bg-[#252526] text-white" : "hover:text-white")}>
                        <span className="text-[#fe6247]">~</span> {activeLayout.id}.hbs
                      </div>
                      <div onClick={() => setActiveTab('json')} className={cn("px-4 md:px-5 border-r border-[#2d2d30] h-full flex items-center gap-2 font-mono cursor-pointer transition-colors", activeTab === 'json' ? "bg-[#252526] text-white" : "hover:text-white")}>
                        <span className="text-[#47fe90]">~</span> data.json
                      </div>
                   </div>
                   <div className="flex-1 min-h-0 relative">
                      <Editor
                        key={`${selectedLayoutId}-${activeTab}`}
                        height="100%"
                        defaultLanguage={activeTab === 'hbs' ? "handlebars" : "json"}
                        language={activeTab === 'hbs' ? "handlebars" : "json"}
                        theme="vs-dark"
                        value={activeTab === 'hbs' ? localCode : localJson}
                        onChange={(val) => activeTab === 'hbs' ? handleEditorCodeChange(val || "") : handleEditorJsonChange(val || "")}
                        options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", padding: { top: 12, bottom: 100 }, scrollBeyondLastLine: false, fixedOverflowWidgets: true }}
                      />

                      <div className="lg:hidden absolute bottom-4 right-4 z-30">
                        <button onClick={() => setShowAiOnMobile(!showAiOnMobile)} className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95", showAiOnMobile ? "bg-[#1e1e1e] text-white rotate-45 border border-white/10" : "bg-[#D62828] text-white")}><X size={24} /></button>
                      </div>

                      <div className={cn("absolute bottom-4 left-4 right-4 z-20 lg:w-[450px] transition-all duration-300 lg:block", showAiOnMobile ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto")}>
                         <AIAssistantPanel 
                           promptValue={aiPrompt} 
                           onPromptChange={setAiPrompt} 
                           onGenerate={handleAiGenerate} 
                           isGenerating={isAiLoading} 
                           showPromptSettings={true} 
                           promptSettings={promptSettings} 
                           onPromptSettingsChange={setPromptSettings} 
                           placeholder="e.g., Add a dark overlay..." 
                           defaultMode={aiMode} 
                           onModeChange={(mode) => setAiMode(mode as 'ai' | 'prompt')} 
                           systemPromptBuilder={(p) => buildLayoutPrompt(p, localCode, localJson, promptSettings)}
                           responseValue={aiResponse}
                           onResponseChange={setAiResponse}
                           onApplyResponse={handleApplyLayoutAiResponse}
                         />
                      </div>
                   </div>
                </div>

                 <div className={cn(
                  "flex-1 bg-[#111111] flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-hidden",
                  "absolute inset-0 z-0 md:relative md:translate-x-0",
                  mobileTab === 'preview' ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                  <div 
                    className="w-full h-full flex items-center justify-center relative"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <SlidePreview 
                      ref={previewRef}
                      templateCode={localCode} 
                      data={currentSampleData} 
                      designConfig={designConfig} 
                      config={designConfig} 
                      interactive={true} 
                      loading={isSwitchingLayout}
                      className="w-full h-full max-h-[80vh] md:max-h-none transition-all duration-300" 
                    />

                    {/* Mobile Navigation Buttons */}
                    <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                       <button 
                         onClick={handlePrevLayout}
                         className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform"
                       >
                         <ChevronLeft size={24} />
                       </button>
                       <button 
                         onClick={handleNextLayout}
                         className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto active:scale-90 transition-transform"
                       >
                         <ChevronRight size={24} />
                       </button>
                    </div>

                    {parseError && (
                      <div className="absolute inset-0 bg-[#b20112]/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 rounded-2xl border-4 border-[#b20112]">
                         <CircleAlert size={48} className="mb-4 text-white" />
                         <h3 className="font-bold text-lg mb-2 text-white">Syntax Error</h3>
                         <div className="w-full max-w-sm bg-black/60 p-4 rounded-xl text-red-300 font-mono text-[10px] text-left overflow-auto max-h-40">{parseError}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f0f10]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50 shrink-0">
               <button onClick={() => setMobileTab('layouts')} className={cn("flex flex-col items-center gap-1", mobileTab === 'layouts' ? "text-[#D62828]" : "text-gray-500")}><LayoutTemplate size={20} /><span className="text-[9px] font-bold uppercase tracking-widest">Library</span></button>
               <button onClick={() => setMobileTab('preview')} className={cn("flex flex-col items-center gap-1", mobileTab === 'preview' ? "text-[#D62828]" : "text-gray-500")}><Play size={20} /><span className="text-[9px] font-bold uppercase tracking-widest">Preview</span></button>
               <button onClick={() => setMobileTab('code')} className={cn("flex flex-col items-center gap-1", mobileTab === 'code' ? "text-[#D62828]" : "text-gray-500")}><Code2 size={20} /><span className="text-[9px] font-bold uppercase tracking-widest">Editor</span></button>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#111111] p-4 md:p-8 flex flex-col items-center relative">
            <div className="w-full max-w-5xl flex flex-col gap-6">
              <div className="bg-[#1e1e1e] border border-[#2d2d30] rounded-xl overflow-hidden shadow-lg">
                 <div className="px-4 md:px-6 py-4 md:py-5 bg-[#161618] border-b border-[#2d2d30]">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                       <h3 className="text-base md:text-xl font-bold text-white flex items-center gap-2"><Sparkles className="text-[#D62828]" size={18} /> AI Deck Generator</h3>
                       <div className="flex items-center bg-[#252526] rounded-md border border-[#333] overflow-hidden text-[9px] md:text-[10px] font-bold text-gray-400 p-0.5">
                         <button onClick={() => setAiMode('ai')} className={cn("px-2 md:px-3 py-1 transition-colors", aiMode === 'ai' && "bg-[#2d2d30] text-white")}>Direct AI</button>
                         <button onClick={() => setAiMode('prompt')} className={cn("px-2 md:px-3 py-1 transition-colors", aiMode === 'prompt' && "bg-[#2d2d30] text-white")}>Raw Prompt</button>
                       </div>
                    </div>
                    <p className="text-[#85858b] text-[11px] md:text-sm mb-4">Describe your presentation's purpose to generate a cohesive set of slide layouts.</p>
                    <div className="space-y-4">
                      <div className="bg-black/20 p-3 md:p-4 rounded-xl border border-white/5">
                        <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                      </div>
                      <div className="relative space-y-4">
                         <div>
                           <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Select Blueprint</label>
                           <select onChange={e => setFullPrompt(e.target.value)} value={PRESET_PROMPTS.some(p => p.value === fullPrompt) ? fullPrompt : (fullPrompt ? "custom" : "")} className="w-full bg-[#1a1a1c] border border-[#333] text-gray-300 text-xs rounded-lg p-2.5 outline-none focus:border-[#D62828] transition-all">
                             <option value="">Choose a template...</option>
                             {PRESET_PROMPTS.map(p => (<option key={p.label} value={p.value}>{p.label}</option>))}
                             <option value="custom">Custom instructions...</option>
                           </select>
                         </div>
                         <Textarea value={fullPrompt} onChange={e => setFullPrompt(e.target.value)} placeholder="e.g., A professional 5-slide SaaS pitch deck..." className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#D62828] font-sans resize-none rounded-xl p-4 min-h-[100px]" disabled={isAiLoading} />
                         <div className="flex justify-end pt-2">
                           <Button onClick={() => { if (aiMode === 'ai') { handleFullDeckGenerate(); } else if (fullPrompt.trim()) { const instruction = `Please generate layouts for: ${fullPrompt}`; const simplifiedLayouts = layouts.map(l => ({ id: l.id, name: l.name })); const fullTextPrompt = buildFullTemplatePrompt(instruction, simplifiedLayouts, promptSettings); copyToClipboard(fullTextPrompt + "\n\nReturn ONLY a JSON array of layouts."); setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000); } }} disabled={isAiLoading || !fullPrompt.trim()} className="w-full md:w-auto bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold py-6 px-8 shadow-xl shadow-[#D62828]/20 group">
                             {isAiLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : (aiMode === 'ai' ? <><Sparkles size={18} className="mr-2" /> Generate Layouts</> : (copiedPrompt ? <><Check size={18} className="mr-2" /> Copied</> : <><Copy size={18} className="mr-2" /> Copy Prompt</>))}
                           </Button>
                         </div>
                      </div>
                    </div>
                 </div>
                 {aiMode === 'prompt' && (
                    <div className="p-4 md:p-6 border-t border-[#2d2d30] bg-[#1a1a1b]">
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Paste Generated JSON</label>
                      <Textarea value={aiResponse} onChange={e => setAiResponse(e.target.value)} placeholder="Paste the JSON array of layouts here..." className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#D62828] font-sans resize-none rounded-xl p-4 min-h-[120px]" />
                      <div className="flex justify-end mt-3">
                        <Button onClick={() => { if (aiResponse.trim()) { try { let jsonStr = aiResponse; const jsonMatch = aiResponse.match(/```(?:json)?\n([\s\S]*?)```/i) || aiResponse.match(/<json>\s*([\s\S]*?)\s*<\/json>/i); if (jsonMatch) jsonStr = jsonMatch[1]; const newLayouts = JSON.parse(jsonStr); if (Array.isArray(newLayouts) && newLayouts.length > 0) { handleAppAction(() => { newLayouts.forEach((nl, index) => { const newId = `l-gen-${Date.now()}-${index}`; addLayoutToActiveTemplate({ id: newId, name: nl.name || `Generated Layout ${index + 1}`, variant: nl.variant || "content", code: nl.code || "<div>Empty</div>", mockData: nl.mockData || undefined }); }); }); setAiResponse(""); } } catch (e) { alert("Invalid JSON"); } } }} disabled={!aiResponse.trim()} className="bg-[#D62828] text-white border-none">Apply Layouts</Button>
                      </div>
                    </div>
                 )}
              </div>
              <div className="mt-8 mb-12">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-bold text-[#85858b] uppercase tracking-wider">Current Layouts ({layouts.length})</h4>
                   <Button onClick={() => { handleAddLayout(); setBuilderMode('individual'); }} variant="outline" className="text-xs border-[#333] hover:bg-[#252526] h-8 text-gray-300"><Plus size={14} className="mr-1" /> Add Blank Layout</Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {layouts.map(l => (
                      <div key={l.id} className="border border-[#2d2d30] rounded-xl overflow-hidden bg-[#161618] group flex flex-col shadow-md hover:border-[#444] transition-colors">
                         <div className="aspect-[16/9] w-full relative flex flex-col overflow-hidden" style={{ backgroundColor: designConfig.bg || '#1a1a1a' }}>
                           <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: designConfig.primary || '#6750a4' }} />
                           <div className="flex-1 flex flex-col p-4 gap-2">
                             <div className="h-3 rounded w-2/3" style={{ backgroundColor: designConfig.primary || '#6750a4', opacity: 0.9 }} />
                             <div className="h-2 rounded w-full" style={{ backgroundColor: designConfig.onSurface || '#ffffff', opacity: 0.15 }} />
                             <div className="h-2 rounded w-4/5" style={{ backgroundColor: designConfig.onSurface || '#ffffff', opacity: 0.1 }} />
                           </div>
                           <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" style={{ backgroundColor: designConfig.primary || '#6750a4', color: designConfig.onPrimary || '#fff' }}>{l.variant || 'layout'}</div>
                         </div>
                         <div className="p-3 border-t border-[#2d2d30] flex items-center justify-between bg-[#1e1e1e]">
                           <span className="text-sm font-medium text-gray-200 truncate pr-2" title={l.name}>{l.name}</span>
                            <div className="flex gap-2 shrink-0">                               <button onClick={() => handleAppAction(() => moveLayoutInActiveTemplate(l.id, 'up'))} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Move Up"><ChevronUp size={14} /></button>
                               <button onClick={() => handleAppAction(() => moveLayoutInActiveTemplate(l.id, 'down'))} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Move Down"><ChevronDown size={14} /></button>
                               <button onClick={() => handleAppAction(() => duplicateLayoutInActiveTemplate(l.id))} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Duplicate"><Copy size={14} /></button>
                               <button onClick={() => { setSelectedLayoutId(l.id); setBuilderMode('individual'); }} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Edit"><Edit2 size={14} /></button>
                               <button onClick={() => handleAppAction(() => setLayoutToDelete(l.id))} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Delete"><Trash2 size={14} /></button>

                           </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FullScreenModal 
        isOpen={showThemeEditor} 
        onClose={() => {
          // Final sync to app store on close
          handleAppAction(() => updateActiveTemplateDesign(themeConfig));
          setShowThemeEditor(false);
        }} 
        title={
          <div className="flex items-center gap-3">
            <Palette size={20} className="text-[#D62828]" />
            <span className="font-black uppercase tracking-widest text-xs md:text-sm">Theme Engine</span>
          </div>
        }
        headerActions={
          <div className="flex items-center border border-[#333] rounded-lg overflow-hidden bg-[#1c1c1e]">
             <button 
               onClick={() => themeUndo()} 
               disabled={themePast.length === 0}
               className="p-1.5 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d2d30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-[#333]"
               title="Undo Theme (Ctrl+Z)"
             >
               <Undo2 size={14} />
             </button>
             <button 
               onClick={() => themeRedo()} 
               disabled={themeFuture.length === 0}
               className="p-1.5 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2d2d30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
               title="Redo Theme (Ctrl+Y)"
             >
               <Redo2 size={14} />
             </button>
          </div>
        }
      >
        <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden bg-[#0f0f10]">
           <div className="order-first lg:order-last lg:flex-1 bg-[#0f0f10] flex items-center justify-center p-4 md:p-8 lg:p-10 shrink-0">
             <ThemePreviewCanvas className="w-full h-auto"><ThemeShowcase config={themeConfig} /></ThemePreviewCanvas>
           </div>
           <div style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? themeSidebarWidth : undefined }} className="w-full lg:border-r border-t lg:border-t-0 border-white/5 bg-[#0c0c0e] flex flex-col lg:overflow-hidden relative group/sidebar shrink-0">
              <div onMouseDown={startResizingTheme} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#D62828]/50 transition-colors z-30 hidden lg:block" />
              <div className="p-4 md:p-6 border-b border-white/5 bg-[#0c0c0e]">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Visual DNA Engine</p>
                  <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                    <button onClick={() => setThemeEntryMode('ai')} className={cn("px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2", themeEntryMode === 'ai' ? "bg-[#D62828] text-white" : "text-gray-500 hover:text-gray-300")}><Sparkles size={12} /> AI</button>
                    <button onClick={() => setThemeEntryMode('manual')} className={cn("px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2", themeEntryMode === 'manual' ? "bg-[#D62828] text-white" : "text-gray-500 hover:text-gray-300")}><Settings2 size={12} /> MANUAL</button>
                  </div>
                </div>
              </div>
              <div className="flex-1 lg:overflow-y-auto custom-scrollbar">
                {themeEntryMode === 'ai' ? (
                   <div className="p-4 md:p-6 animate-in fade-in slide-in-from-left-4 duration-300">
                      <AIAssistantPanel promptValue={themeAiPrompt} onPromptChange={setThemeAiPrompt} onGenerate={handleThemeAiGenerate} isGenerating={isGeneratingTheme} placeholder="Describe brand..." defaultMode="ai" onModeChange={() => {}} systemPromptBuilder={buildDesignConfigPrompt} responseValue={themeAiResponse} onResponseChange={setThemeAiResponse} onApplyResponse={handleApplyThemeAiResponse} />
                   </div>
                ) : (
                   <div className="animate-in fade-in slide-in-from-left-4 duration-300 h-full">
                     <ThemeSettingsPanel config={themeConfig} onChange={(updates) => updateThemeConfig(updates)} layout="sidebar" width={themeSidebarWidth} />
                   </div>
                )}
              </div>
           </div>
        </div>
      </FullScreenModal>

      <ConfirmationModal 
        isOpen={!!layoutToDelete}
        title="Delete Layout?"
        message="Are you sure you want to delete this layout? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (layoutToDelete) {
            handleAppAction(() => removeLayoutFromActiveTemplate(layoutToDelete));
            setLayoutToDelete(null);
          }
        }}
        onCancel={() => setLayoutToDelete(null)}
        variant="danger"
      />
    </div>

  );
}
