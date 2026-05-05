import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore, DesignConfig, SlideData, Presentation } from "../store";
import { Button, Textarea, Input } from "../components/ui";
import { SlidePreview, SlideStatic } from "../components/SlidePreview";
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Check, 
  RefreshCw, 
  Layout, 
  Palette, 
  Type, 
  Square, 
  Send, 
  Code, 
  Eye, 
  Save, 
  Download, 
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Settings2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { 
  askAiForDesignConfig, 
  askAiForFullPresentationMagic, 
  askAiForSlideRefinement,
  askAiForLayoutCode,
  buildLayoutPrompt,
  buildDesignConfigPrompt,
  buildPresentationMagicPrompt,
  askAiForDesignUpdate,
  buildDesignUpdatePrompt,
  PromptSettings 
} from "../lib/gemini";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { PromptSettingsForm } from "../components/PromptSettingsUI";

type BuilderStep = "PROMPT" | "DESIGN_PREVIEW" | "GENERATING" | "EDITOR";

const POPULAR_FONTS = [
  "Inter", "Montserrat", "Open Sans", "Roboto", "Lato", "Poppins", "Oswald", "Lora", 
  "Montserrat", "Raleway", "Ubuntu", "Merriweather", "Playfair Display", "Nunito", 
  "Muli", "Quicksand", "Work Sans", "Rubik", "Kanit", "Nanum Gothic", "Fira Sans", 
  "PT Sans", "Josefin Sans", "Bebas Neue", "Arvo", "Libre Baskerville", "Exo 2", 
  "Pacifico", "Caveat", "Indie Flower", "Dancing Script", "Zilla Slab", "Space Grotesk", 
  "Outfit", "Be Vietnam Pro", "JetBrains Mono", "Space Mono", "Syne", "Urbanist", "Clash Display"
];

const GoogleFontLoader = ({ fonts }: { fonts: string[] }) => {
  useEffect(() => {
    const uniqueFonts = Array.from(new Set(fonts)).filter(f => f && f !== 'sans-serif' && f !== 'serif' && f !== 'monospace');
    if (uniqueFonts.length === 0) return;
    
    const linkId = 'dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    const fontQuery = uniqueFonts.map(f => `${f.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900`).join('&family=');
    const href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
    
    if (link.href !== href) {
      link.href = href;
      // Force the browser to recognize the new fonts
      uniqueFonts.forEach(font => {
        try {
          (document as any).fonts.load(`1em "${font}"`);
        } catch (e) {}
      });
    }
  }, [fonts]);
  return null;
};

const DesignSystemLoader = ({ config }: { config: Record<string, any> | null }) => {
  useEffect(() => {
    if (!config) return;
    const styleId = 'dynamic-design-system';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.innerHTML = `
      :root {
        --tw-lumina-primary: ${config.primary};
        --tw-lumina-primary-hover: ${config.primaryHover};
        --tw-lumina-secondary: ${config.secondary};
        --tw-lumina-accent: ${config.accent};
        --tw-lumina-bg: ${config.bg};
        --tw-lumina-surface: ${config.surface};
        --tw-lumina-surface-contrast: ${config.surfaceContrast};
        --tw-lumina-text-primary: ${config.textPrimary};
        --tw-lumina-text-secondary: ${config.textSecondary};
        --tw-lumina-border: ${config.border};
        --tw-lumina-radius: ${config.borderRadius};
        --tw-lumina-btn-radius: ${config.buttonRadius};
        --tw-lumina-card-radius: ${config.cardRadius};
        --tw-lumina-shadow-soft: ${config.shadowSoft};
        --tw-lumina-shadow-strong: ${config.shadowStrong};
      }

      .text-lumina-primary { color: var(--tw-lumina-primary); }
      .bg-lumina-primary { background-color: var(--tw-lumina-primary); }
      .text-lumina-secondary { color: var(--tw-lumina-secondary); }
      .bg-lumina-secondary { background-color: var(--tw-lumina-secondary); }
      .bg-lumina-bg { background-color: var(--tw-lumina-bg); }
      .bg-lumina-surface { background-color: var(--tw-lumina-surface); }
      .text-lumina-text-primary { color: var(--tw-lumina-text-primary); }
      .text-lumina-text-secondary { color: var(--tw-lumina-text-secondary); }
      .border-lumina-border { border-color: var(--tw-lumina-border); }
      
      .rounded-lumina { border-radius: var(--tw-lumina-radius); }
      .rounded-lumina-btn { border-radius: var(--tw-lumina-btn-radius); }
      .rounded-lumina-card { border-radius: var(--tw-lumina-card-radius); }

      .font-display { 
        font-family: "${config.headingFont}", sans-serif; 
        font-weight: ${config.headingWeight || '900'};
      }
      .font-body { font-family: "${config.fontFamily}", sans-serif; }
    `;
  }, [config]);
  return null;
};

export function MagicBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    presentations, 
    createPresentation, 
    updateSlideContent, 
    setSlides, 
    setActivePresentation,
    templates,
    createTemplate,
    updateTemplateDesign
  } = useAppStore();

  const [step, setStep] = useState<BuilderStep>("PROMPT");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [designConfig, setDesignConfig] = useState<DesignConfig | null>(null);
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(id || null);
  
  // Step 1 AI Mode State
  const [initialPromptMode, setInitialPromptMode] = useState<'ai' | 'prompt'>('ai');
  const [showInitialPromptSettings, setShowInitialPromptSettings] = useState(false);
  const [initialPromptSettings, setInitialPromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: "",
    detailLevel: ""
  });
  const [initialPromptResponse, setInitialPromptResponse] = useState("");
  const [copiedInitialPrompt, setCopiedInitialPrompt] = useState(false);

  // Step 2 AI Mode State (Confirm & Generate Slides)
  const [step2PromptMode, setStep2PromptMode] = useState<'ai' | 'prompt'>('ai');
  const [showStep2PromptSettings, setShowStep2PromptSettings] = useState(false);
  const [step2PromptSettings, setStep2PromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: "",
    detailLevel: ""
  });
  const [step2PromptResponse, setStep2PromptResponse] = useState("");
  const [copiedStep2Prompt, setCopiedStep2Prompt] = useState(false);

  // Editor State
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isRefining, setIsRefining] = useState(false);
  const [showDesignSettings, setShowDesignSettings] = useState(false);
  const [fontSearch, setFontSearch] = useState({ heading: "", body: "" });
  const [localJson, setLocalJson] = useState("");
  const [isAiAssistantCollapsed, setIsAiAssistantCollapsed] = useState(false);

  const headingFonts = useMemo(() => {
    if (!designConfig) return POPULAR_FONTS;
    const base = fontSearch.heading 
      ? [fontSearch.heading, ...POPULAR_FONTS.filter(f => f.toLowerCase().includes(fontSearch.heading.toLowerCase()) && f !== fontSearch.heading)]
      : POPULAR_FONTS;
    if (designConfig.headingFont && !base.includes(designConfig.headingFont)) {
      return [designConfig.headingFont, ...base];
    }
    return Array.from(new Set(base));
  }, [fontSearch.heading, designConfig?.headingFont]);

  const bodyFonts = useMemo(() => {
    if (!designConfig) return POPULAR_FONTS;
    const base = fontSearch.body 
      ? [fontSearch.body, ...POPULAR_FONTS.filter(f => f.toLowerCase().includes(fontSearch.body.toLowerCase()) && f !== fontSearch.body)]
      : POPULAR_FONTS;
    if (designConfig.fontFamily && !base.includes(designConfig.fontFamily)) {
      return [designConfig.fontFamily, ...base];
    }
    return Array.from(new Set(base));
  }, [fontSearch.body, designConfig?.fontFamily]);

  // IDE AI Assistant State
  const [ideAiPrompt, setIdeAiPrompt] = useState("");
  const [ideAiResponse, setIdeAiResponse] = useState("");
  const [ideAiMode, setIdeAiMode] = useState<'ai' | 'prompt'>('ai');
  const [ideAiTarget, setIdeAiTarget] = useState<'slide' | 'design'>('slide');
  const [showIdePromptSettings, setShowIdePromptSettings] = useState(false);
  const [idePromptSettings, setIdePromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: "",
    detailLevel: ""
  });
  const [isIdeAiLoading, setIsIdeAiLoading] = useState(false);
  const [copiedIdePrompt, setCopiedIdePrompt] = useState(false);

  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  const activePresentation = presentations.find(p => p.id === currentPresentationId);
  const slides = activePresentation?.slides || [];
  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

  useEffect(() => {
    if (activeSlide) {
      setLocalJson(JSON.stringify(activeSlide.content || {}, null, 2));
    }
  }, [activeSlide?.id]);

  useEffect(() => {
    // Check if key is available (it's injected via Vite define)
    if (!process.env.GEMINI_API_KEY) {
      setIsApiKeyMissing(true);
    }

    if (id) {
      const pres = presentations.find(p => p.id === id);
      if (pres) {
        setCurrentPresentationId(id);
        setStep("EDITOR");
        
        // Load design config from template if not already set
        if (!designConfig) {
          const template = templates.find(t => t.id === pres.templateId);
          if (template) {
            setDesignConfig(template.designConfig);
          }
        }

        // Recover the original prompt/topic from the presentation name
        if (!prompt) {
          setPrompt(pres.name);
        }
      }
    }
  }, [id, presentations, templates, prompt]);

  // Sync designConfig back to template if changed in EDITOR mode
  useEffect(() => {
    if (step === "EDITOR" && designConfig && activePresentation?.templateId) {
      updateTemplateDesign(activePresentation.templateId, designConfig);
    }
  }, [designConfig, step, activePresentation?.templateId, updateTemplateDesign]);

  // --- Step 1: Prompt -> Design Config ---
  const handleGenerateDesign = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const config = await askAiForDesignConfig(prompt, initialPromptSettings);
      if (config) {
        setDesignConfig(config);
        setStep("DESIGN_PREVIEW");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate design system.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyInitialResponse = () => {
    if (!initialPromptResponse.trim()) return;
    try {
      const jsonMatch = initialPromptResponse.match(/<json>([\s\S]*?)<\/json>/i) || initialPromptResponse.match(/```json\n([\s\S]*?)```/i);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : initialPromptResponse.trim();
      const parsed = JSON.parse(jsonStr);
      setDesignConfig(parsed);
      setStep("DESIGN_PREVIEW");
    } catch (e) {
      alert("Invalid design config JSON.");
    }
  };

  const handleApplyStep2Response = (pastedJson?: string) => {
    const raw = pastedJson || step2PromptResponse;
    if (!raw.trim() || !designConfig) return;
    try {
      // Try to extract JSON from markdown if present
      const jsonMatch = raw.match(/<json>([\s\S]*?)<\/json>/i) || raw.match(/```json\n([\s\S]*?)```/i);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      const generatedSlides = JSON.parse(jsonStr);

      if (generatedSlides && Array.isArray(generatedSlides)) {
        const templateId = createTemplate(`${prompt.substring(0, 20)} Magic Theme`, designConfig);
        const newId = createPresentation(prompt.substring(0, 40) || "Magic Presentation", templateId, 'magic');
        setCurrentPresentationId(newId);
        setActivePresentation(newId);

        const newSlides: SlideData[] = generatedSlides.map((s: any) => ({
          id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          layoutId: "custom",
          content: s.content || {},
          code: s.code || ""
        }));

        setSlides(newSlides);
        setActiveSlideId(newSlides[0].id);
        setStep("EDITOR");
        navigate(`/magic-builder/${newId}`);
      }
    } catch (e) {
      alert("Invalid slides JSON. Expected an array of { code, content } objects.");
    }
  };

  // --- Step 2: Confirm Design -> Generate Slides ---
  const handleConfirmDesign = async () => {
    if (!designConfig) return;
    setStep("GENERATING");
    setIsGenerating(true);
    try {
      // 1. Create a template for this design (so it persists)
      const templateId = createTemplate(`${prompt.substring(0, 20)} Magic Theme`, designConfig);
      
      // 2. Generate slides with custom code
      const generatedSlides = await askAiForFullPresentationMagic(prompt || activePresentation?.name || "Presentation", designConfig, step2PromptSettings);
      
      if (generatedSlides && generatedSlides.length > 0) {
        // 3. Create the presentation
        const newId = createPresentation(prompt.substring(0, 40) || "Magic Presentation", templateId, 'magic');
        setCurrentPresentationId(newId);
        setActivePresentation(newId);

        const newSlides: SlideData[] = generatedSlides.map((s: any) => ({
          id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          layoutId: "custom", // Not using standard layouts
          content: s.content || {},
          code: s.code || ""
        }));

        setSlides(newSlides);
        setActiveSlideId(newSlides[0].id);
        setStep("EDITOR");
        navigate(`/magic-builder/${newId}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate presentation.");
      setStep("DESIGN_PREVIEW");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Editor: Refinement ---
  const handleRefineSlide = async () => {
    if (!chatInput.trim() || !activeSlide || !currentPresentationId) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsRefining(true);

    try {
      const result = await askAiForSlideRefinement(userMsg, activeSlide.code || "", JSON.stringify(activeSlide.content), designConfig || undefined);
      if (result) {
        const updatedSlides = slides.map(s => 
          s.id === activeSlide.id 
            ? { ...s, code: result.code, content: result.content } 
            : s
        );
        setSlides(updatedSlides);
        setChatHistory(prev => [...prev, { role: 'ai', content: "I've updated the slide for you!" }]);
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble updating that slide." }]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleUpdateCode = (newCode: string) => {
    if (!activeSlide || !currentPresentationId) return;
    const updatedSlides = slides.map(s => s.id === activeSlide.id ? { ...s, code: newCode } : s);
    setSlides(updatedSlides);
  };

  const handleUpdateContent = (newContentStr: string) => {
    setLocalJson(newContentStr);
    if (!activeSlide || !currentPresentationId) return;
    try {
      const parsed = JSON.parse(newContentStr);
      const updatedSlides = slides.map(s => s.id === activeSlide.id ? { ...s, content: parsed } : s);
      setSlides(updatedSlides);
    } catch (e) {
      // JSON error - ignore while typing
    }
  };
  
  const handleIdeAiGenerate = async () => {
    if (!ideAiPrompt.trim()) return;
    setIsIdeAiLoading(true);
    try {
      if (ideAiTarget === 'slide') {
        const { code, json } = await askAiForLayoutCode(ideAiPrompt, activeSlide?.code || "", JSON.stringify(activeSlide?.content || {}), designConfig || undefined, idePromptSettings);
        if (code) {
          const updatedSlides = slides.map(s => 
            s.id === activeSlide.id 
              ? { ...s, code, content: json ? JSON.parse(json) : s.content } 
              : s
          );
          setSlides(updatedSlides);
          setIdeAiPrompt("");
        }
      } else if (ideAiTarget === 'design' && designConfig) {
        const updatedConfig = await askAiForDesignUpdate(ideAiPrompt, designConfig, idePromptSettings);
        if (updatedConfig) {
          setDesignConfig({ ...designConfig, ...updatedConfig });
          setIdeAiPrompt("");
        }
      }
    } catch (e) {
      console.error(e);
      alert("AI Generation failed.");
    } finally {
      setIsIdeAiLoading(false);
    }
  };

  // --- Export ---
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExportPDF = async () => {
    if (!activePresentation || slides.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });
      for (let i = 0; i < slides.length; i++) {
        setExportProgress(Math.round((i / slides.length) * 100));
        const slide = slides[i];
        const element = document.getElementById(`magic-export-slide-${slide.id}`);
        if (!element) continue;
        
        await new Promise(r => setTimeout(r, 500));
        
        const iframe = element.querySelector("iframe");
        let imgData;
        try {
          if (iframe?.contentWindow && (iframe.contentWindow as any).captureSlide) {
            imgData = await (iframe.contentWindow as any).captureSlide();
          } else {
            imgData = await toJpeg(element, { quality: 0.95, pixelRatio: 2 });
          }
        } catch (err) {
          console.warn("Magic capture failed:", err);
          continue;
        }
        
        if (!imgData) continue;
        if (i > 0) pdf.addPage([1280, 720], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1280, 720, undefined, "FAST");
      }
      setExportProgress(100);
      pdf.save(`${activePresentation.name}.pdf`);
    } catch (e) {
      console.error("Magic export error:", e);
      alert("Export failed.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  // --- UI Components ---

  if (step === "PROMPT") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#111111] p-6">
        {isApiKeyMissing && (
          <div className="absolute top-6 left-6 right-6 bg-[#D62828] text-white p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 z-50 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
               <Settings2 className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">GEMINI_API_KEY is missing!</h3>
              <p className="text-sm text-white/80">Please add your Gemini API key to the <code className="bg-black/20 px-1 rounded">.env</code> file or the Secrets panel to enable AI features.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="bg-white text-[#D62828] hover:bg-white/90">
              Reload Page
            </Button>
          </div>
        )}
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#FF6347] to-[#D62828] shadow-2xl animate-bounce">
            <Sparkles className="text-white w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight">What's your vision?</h1>
          <p className="text-xl text-gray-400">Tell us about your presentation, and our AI will build a custom design system and unique slides from scratch.</p>
          
          <div className="flex flex-col gap-6 mt-12">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowInitialPromptSettings(!showInitialPromptSettings)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors"
              >
                <Settings2 size={16} /> Prompt Settings {showInitialPromptSettings ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>
              
              <div className="flex items-center bg-[#1a1a1c] rounded-xl p-1 border border-[#2d2d30] text-xs font-bold text-gray-500">
                <button 
                  onClick={() => setInitialPromptMode('ai')} 
                  className={cn("px-4 py-2 rounded-lg transition-all", initialPromptMode === 'ai' ? "bg-[#2d2d30] text-white shadow-sm" : "hover:text-gray-300")}
                >
                  AI Generate
                </button>
                <button 
                  onClick={() => setInitialPromptMode('prompt')} 
                  className={cn("px-4 py-2 rounded-lg transition-all", initialPromptMode === 'prompt' ? "bg-[#2d2d30] text-white shadow-sm" : "hover:text-gray-300")}
                >
                  Raw Prompt
                </button>
              </div>
            </div>

            {showInitialPromptSettings && (
              <div className="bg-[#1a1a1c] border border-[#2d2d30] rounded-3xl p-6 shadow-xl text-left">
                <PromptSettingsForm settings={initialPromptSettings} setSettings={setInitialPromptSettings} />
              </div>
            )}

            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#1a1a1c] border-2 border-[#2d2d30] text-white text-xl rounded-3xl p-8 pr-20 outline-none focus:border-[#D62828] transition-all min-h-[160px] resize-none shadow-2xl"
                placeholder="e.g. A futuristic pitch deck for a zero-gravity hotel brand..."
                autoFocus
              />
              <button 
                onClick={() => {
                  if (initialPromptMode === 'ai') {
                    handleGenerateDesign();
                  } else {
                    const textPrompt = buildDesignConfigPrompt(prompt, initialPromptSettings);
                    navigator.clipboard.writeText(textPrompt);
                    setCopiedInitialPrompt(true);
                    setTimeout(() => setCopiedInitialPrompt(false), 2000);
                  }
                }}
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-6 bottom-6 p-4 rounded-2xl bg-[#D62828] text-white hover:bg-[#b20112] disabled:opacity-50 transition-all shadow-lg flex items-center justify-center min-w-[56px]"
                title={initialPromptMode === 'ai' ? "Generate Design" : "Copy Prompt"}
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : (
                  initialPromptMode === 'ai' ? <ArrowRight /> : (copiedInitialPrompt ? <Check size={20} /> : <Copy size={20} />)
                )}
              </button>
            </div>

            {initialPromptMode === 'prompt' && (
              <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
                <textarea
                  value={initialPromptResponse}
                  onChange={(e) => setInitialPromptResponse(e.target.value)}
                  className="w-full bg-[#1a1a1c] border-2 border-[#2d2d30] text-white text-sm rounded-3xl p-6 pr-20 outline-none focus:border-[#D62828] transition-all min-h-[120px] resize-none shadow-xl font-mono"
                  placeholder="Paste the AI-generated Design Config JSON here..."
                />
                <button 
                  onClick={handleApplyInitialResponse}
                  disabled={!initialPromptResponse.trim()}
                  className="absolute right-4 bottom-4 px-6 py-2 rounded-xl bg-[#D62828] text-white font-bold hover:bg-[#b20112] disabled:opacity-50 transition-all shadow-lg"
                >
                  Apply & Preview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "DESIGN_PREVIEW" && designConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#111111] p-8 overflow-auto">
        <GoogleFontLoader fonts={[designConfig.fontFamily, designConfig.headingFont]} />
        <div className="max-w-5xl w-full space-y-12 py-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white">Your Custom Design System</h2>
            <p className="text-gray-400 text-lg">We've crafted this visual identity based on your prompt. Does it feel right?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Color Palette */}
            <div className="bg-[#1a1a1c] border border-[#2d2d30] rounded-3xl p-8 space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Palette size={16} /> Color Palette
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Primary", color: designConfig.primary },
                  { label: "Secondary", color: designConfig.secondary },
                  { label: "Accent", color: designConfig.accent },
                  { label: "Surface", color: designConfig.surface },
                  { label: "Background", color: designConfig.bg },
                  { label: "Text", color: designConfig.textPrimary },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl shadow-inner border border-white/10" style={{ backgroundColor: c.color }} />
                    <div>
                      <div className="text-white font-bold text-sm">{c.label}</div>
                      <div className="text-gray-500 text-xs font-mono">{c.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="bg-[#1a1a1c] border border-[#2d2d30] rounded-3xl p-8 space-y-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Type size={16} /> Typography
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-gray-500 text-xs mb-2">Heading Font: {designConfig.headingFont}</div>
                  <div className="text-4xl font-black text-white" style={{ fontFamily: designConfig.headingFont }}>
                    The Quick Brown Fox
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-2">Body Font: {designConfig.fontFamily}</div>
                  <div className="text-lg text-gray-300 leading-relaxed" style={{ fontFamily: designConfig.fontFamily }}>
                    Design is not just what it looks like and feels like. Design is how it works.
                  </div>
                </div>
              </div>
            </div>

            {/* Shapes & Style */}
            <div className="bg-[#1a1a1c] border border-[#2d2d30] rounded-3xl p-8 space-y-6 md:col-span-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Square size={16} /> Style & Shapes
              </h3>
              <div className="flex flex-wrap gap-8">
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs">Buttons</div>
                  <div className="h-12 px-6 flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: designConfig.primary, borderRadius: designConfig.buttonRadius }}>
                    Click Me
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs">Cards</div>
                  <div className="w-32 h-20 border border-[#2d2d30] shadow-xl" style={{ backgroundColor: designConfig.surface, borderRadius: designConfig.cardRadius }} />
                </div>
                <div className="space-y-2">
                  <div className="text-gray-500 text-xs">Shadows</div>
                  <div className="w-32 h-20 bg-white" style={{ borderRadius: designConfig.borderRadius, boxShadow: designConfig.shadowStrong }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1c] border border-[#2d2d30] rounded-3xl p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-[#D62828]" /> Presentation Vision
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#161618] border-2 border-[#2d2d30] text-white text-sm rounded-2xl p-6 outline-none focus:border-[#D62828] transition-all min-h-[100px] resize-none shadow-inner"
                placeholder="Describe your presentation topic..."
              />
              {!prompt && (
                <div className="text-[#D62828] text-xs font-bold animate-pulse flex items-center gap-1">
                   <Settings2 size={12} /> Topic is missing! Please describe your presentation above.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2d2d30]">
              <button 
                onClick={() => setShowStep2PromptSettings(!showStep2PromptSettings)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors"
              >
                <Settings2 size={16} /> Slide Generation Settings {showStep2PromptSettings ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>
              
              <div className="flex items-center bg-[#161618] rounded-xl p-1 border border-[#2d2d30] text-xs font-bold text-gray-500">
                <button 
                  onClick={() => setStep2PromptMode('ai')} 
                  className={cn("px-4 py-2 rounded-lg transition-all", step2PromptMode === 'ai' ? "bg-[#2d2d30] text-white shadow-sm" : "hover:text-gray-300")}
                >
                  AI Generate
                </button>
                <button 
                  onClick={() => setStep2PromptMode('prompt')} 
                  className={cn("px-4 py-2 rounded-lg transition-all", step2PromptMode === 'prompt' ? "bg-[#2d2d30] text-white shadow-sm" : "hover:text-gray-300")}
                >
                  Raw Prompt
                </button>
              </div>
            </div>

            {showStep2PromptSettings && (
              <div className="bg-[#161618] border border-[#2d2d30] rounded-2xl p-6 shadow-xl">
                <PromptSettingsForm settings={step2PromptSettings} setSettings={setPromptSettings} />
              </div>
            )}

            {step2PromptMode === 'prompt' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 font-medium">1. Copy this prompt to generate your slides:</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const textPrompt = buildPresentationMagicPrompt(prompt || activePresentation?.name || "Presentation", designConfig, step2PromptSettings);
                      navigator.clipboard.writeText(textPrompt);
                      setCopiedStep2Prompt(true);
                      setTimeout(() => setCopiedStep2Prompt(false), 2000);
                    }}
                    className="border-[#2d2d30] text-xs h-8"
                  >
                    {copiedStep2Prompt ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
                    {copiedStep2Prompt ? "Copied!" : "Copy Slide Prompt"}
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    value={step2PromptResponse}
                    onChange={(e) => setStep2PromptResponse(e.target.value)}
                    className="w-full bg-[#161618] border-2 border-[#2d2d30] text-white text-sm rounded-2xl p-6 pr-20 outline-none focus:border-[#D62828] transition-all min-h-[160px] resize-none shadow-inner font-mono"
                    placeholder="2. Paste the AI-generated Slides JSON here..."
                  />
                  <button 
                    onClick={() => handleApplyStep2Response()}
                    disabled={!step2PromptResponse.trim()}
                    className="absolute right-4 bottom-4 px-6 py-2 rounded-xl bg-[#D62828] text-white font-bold hover:bg-[#b20112] disabled:opacity-50 transition-all shadow-lg"
                  >
                    Generate Presentation
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center gap-6 pt-4">
                <Button variant="outline" size="lg" onClick={() => setStep("PROMPT")} className="border-[#2d2d30] text-gray-400 min-w-[200px]">
                  <RefreshCw className="mr-2" size={18} /> Back to Vision
                </Button>
                <Button size="lg" onClick={handleConfirmDesign} className="min-w-[240px] bg-gradient-to-r from-[#FF6347] to-[#D62828] hover:scale-105 transition-transform duration-300 shadow-xl">
                  <Sparkles className="mr-2" size={18} /> Confirm & Generate Slides
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "GENERATING") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#111111] p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#2d2d30]" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#D62828] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-[#D62828] w-12 h-12" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white">Generating Your Story...</h2>
          <p className="text-gray-400">Our AI is designing custom layouts and writing content for each slide. This usually takes 10-20 seconds.</p>
          
          <div className="w-full bg-[#1a1a1c] h-2 rounded-full overflow-hidden">
            <div className="h-full bg-[#D62828] animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // --- Final Step: EDITOR ---
  return (
    <div className="flex h-full w-full bg-[#111111] text-gray-200 overflow-hidden relative">
      {/* Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-md w-full space-y-6 text-center">
              <div className="relative w-24 h-24 mx-auto">
                 <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                 <div 
                   className="absolute inset-0 rounded-full border-4 border-t-[#D62828] animate-spin" 
                   style={{ animationDuration: '2s' }}
                 />
                 <div className="absolute inset-0 flex items-center justify-center text-[#D62828] font-black text-xl">
                   {exportProgress}%
                 </div>
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-white tracking-tight">Generating PDF</h2>
                 <p className="text-gray-400">Rendering your magic slides with high precision...</p>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                 <div 
                   className="h-full bg-gradient-to-r from-[#D62828] to-[#fe6247] transition-all duration-500 ease-out shadow-[0_0_15px_rgba(214,40,40,0.5)]" 
                   style={{ width: `${exportProgress}%` }}
                 />
              </div>
           </div>
        </div>
      )}

      {/* Main UI */}
      <DesignSystemLoader config={designConfig} />
      <GoogleFontLoader fonts={[designConfig?.fontFamily || 'Inter', designConfig?.headingFont || 'Inter']} />
      
      {/* Left Panel: Navigation & Slides */}
      <div className="w-64 bg-[#161618] border-r border-[#2d2d30] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2d2d30] flex items-center justify-between">
           <Button variant="ghost" onClick={() => navigate("/")} className="p-0 h-auto text-gray-400 hover:text-white"><ChevronLeft size={20}/></Button>
           <h2 className="font-bold text-sm text-white">Magic Slides</h2>
           <Button variant="ghost" onClick={() => navigate("/")} className="p-0 h-auto text-gray-400 hover:text-white"><X size={20}/></Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {slides.map((s, idx) => (
            <div 
              key={s.id}
              onClick={() => setActiveSlideId(s.id)}
              className={cn(
                "relative group cursor-pointer border-2 rounded-xl aspect-video w-full flex flex-col bg-[#1e1e1e] transition-all overflow-hidden",
                activeSlideId === s.id ? "border-[#D62828] shadow-lg shadow-[#D62828]/20" : "border-[#2d2d30] hover:border-[#3d3d40]"
              )}
            >
              <div 
                className="flex-1 flex items-center justify-center p-2 text-center"
                style={{ backgroundColor: designConfig?.bg }}
              >
                 <div className="line-clamp-2 text-[8px] font-bold" style={{ color: designConfig?.primary }}>
                   {s.content.title || "Slide " + (idx + 1)}
                 </div>
              </div>
              <div className="h-6 border-t border-[#2d2d30] px-2 flex items-center justify-between bg-[#161618]">
                 <span className="text-[8px] font-bold text-gray-500">{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-[#2d2d30] space-y-2">
           <Button 
            onClick={handleExportPDF} 
            disabled={isExporting}
            className="w-full bg-[#D62828] hover:bg-[#b20112] text-white h-10 gap-2"
           >
             {isExporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} Export PDF
           </Button>
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <div className="h-16 border-b border-[#2d2d30] bg-[#161618] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white text-lg">Magic Editor</span>
            <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#2d2d30]">
               <button onClick={() => setViewMode('preview')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-colors", viewMode === 'preview' ? "bg-[#333] text-white" : "text-gray-400")}>Visual</button>
               <button onClick={() => setViewMode('code')} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-colors", viewMode === 'code' ? "bg-[#333] text-white" : "text-gray-400")}>Code</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" className="border-[#2d2d30] text-gray-300" onClick={() => setShowDesignSettings(!showDesignSettings)}>
                <Palette size={16} className="mr-2" /> Design
             </Button>
             <Button className="bg-[#2d2d30] hover:bg-[#3d3d40] text-white">
                <Save size={16} className="mr-2" /> Saved
             </Button>
          </div>
        </div>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 overflow-auto">
             {activeSlide && (
               <SlidePreview 
                 templateCode={activeSlide.code || ""} 
                 data={activeSlide.content} 
                 designConfig={designConfig || undefined}
               />
             )}
          </div>
          
          {/* AI Chat Drawer */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 bg-[#161618] border-t border-[#2d2d30] transition-all duration-500 ease-in-out z-20",
            isAiAssistantCollapsed ? "h-12" : "h-64"
          )}>
             <div className="h-12 flex items-center justify-between px-6 border-b border-[#2d2d30]">
                <div className="flex items-center gap-2">
                   <Sparkles size={16} className="text-[#D62828]" />
                   <span className="text-xs font-bold text-white uppercase tracking-wider">AI Assistant</span>
                </div>
                <button onClick={() => setIsAiAssistantCollapsed(!isAiAssistantCollapsed)} className="text-gray-500 hover:text-white transition-colors">
                   {isAiAssistantCollapsed ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>
             </div>
             
             {!isAiAssistantCollapsed && (
                <div className="p-4 flex h-[calc(100%-48px)] gap-4">
                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 opacity-50">
                           <Sparkles size={32} />
                           <p className="text-xs">Ask AI to change colors, add points, or rewrite code...</p>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                           <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", msg.role === 'user' ? "bg-[#D62828] text-white" : "bg-[#2d2d30] text-gray-200")}>
                                 {msg.content}
                              </div>
                           </div>
                        ))
                      )}
                      {isRefining && <div className="flex justify-start"><div className="bg-[#2d2d30] px-4 py-2 rounded-2xl animate-pulse text-xs text-gray-400">AI is thinking...</div></div>}
                   </div>
                   <div className="w-80 flex flex-col gap-2">
                      <Textarea 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleRefineSlide())}
                        placeholder="Refine this slide..."
                        className="flex-1 bg-[#1a1a1c] border-[#2d2d30] text-white text-xs resize-none rounded-xl focus-visible:ring-[#D62828]"
                      />
                      <Button onClick={handleRefineSlide} disabled={isRefining || !chatInput.trim()} className="bg-[#D62828] hover:bg-[#b20112] text-white">
                         Send Request
                      </Button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Right Panel: Sidebars */}
      <div className={cn(
        "w-80 bg-[#161618] border-l border-[#2d2d30] transition-all flex flex-col shrink-0",
        showDesignSettings ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
         <div className="h-16 flex items-center px-6 border-b border-[#2d2d30] justify-between">
            <h2 className="font-bold text-sm text-white uppercase tracking-widest">{viewMode === 'preview' ? "Content" : "Source Code"}</h2>
            <div className="flex items-center gap-2">
               <button onClick={() => setIdeAiMode(ideAiMode === 'ai' ? 'prompt' : 'ai')} className={cn("text-[10px] font-bold px-2 py-0.5 rounded border transition-colors", ideAiMode === 'ai' ? "border-[#D62828] text-[#D62828]" : "border-gray-600 text-gray-500")}>
                  {ideAiMode === 'ai' ? "AI" : "Prompt"}
               </button>
               <button onClick={() => setShowIdePromptSettings(!showIdePromptSettings)} className={cn("text-gray-500 hover:text-white transition-colors", showIdePromptSettings && "text-white")}>
                  <Settings2 size={16} />
               </button>
            </div>
         </div>
         
         <div className="flex-1 flex flex-col overflow-hidden relative">
            {showIdePromptSettings && (
               <div className="absolute top-0 left-0 right-0 bg-[#1e1e20] border-b border-[#2d2d30] p-4 z-30 shadow-2xl animate-in slide-in-from-top-4">
                  <PromptSettingsForm settings={idePromptSettings} setSettings={setIdePromptSettings} />
               </div>
            )}
            
            <div className="flex-1 p-4 overflow-y-auto space-y-6">
               {viewMode === 'preview' ? (
                  <div className="flex flex-col h-full space-y-4">
                     <Textarea 
                       value={localJson}
                       onChange={e => handleUpdateContent(e.target.value)}
                       spellCheck={false}
                       className="flex-1 bg-[#1a1a1c] border-[#2d2d30] text-gray-300 font-mono text-[11px] resize-none focus-visible:ring-[#D62828]"
                     />
                  </div>
               ) : (
                  <div className="flex flex-col h-full space-y-4">
                     <Textarea 
                       value={activeSlide?.code || ""}
                       onChange={e => handleUpdateCode(e.target.value)}
                       spellCheck={false}
                       className="flex-1 bg-[#1a1a1c] border-[#2d2d30] text-gray-300 font-mono text-[11px] resize-none focus-visible:ring-[#D62828]"
                     />
                  </div>
               )}
            </div>
            
            {/* Contextual AI Assistant */}
            <div className="p-4 bg-[#1a1a1c] border-t border-[#2d2d30] space-y-3">
               <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setIdeAiTarget('slide')} className={cn("text-[9px] font-bold px-2 py-1 rounded transition-colors", ideAiTarget === 'slide' ? "bg-[#D62828] text-white" : "text-gray-500 hover:text-white")}>Update Slide</button>
                  <button onClick={() => setIdeAiTarget('design')} className={cn("text-[9px] font-bold px-2 py-1 rounded transition-colors", ideAiTarget === 'design' ? "bg-[#D62828] text-white" : "text-gray-500 hover:text-white")}>Update Brand</button>
               </div>
               <div className="relative">
                  <Textarea 
                    value={ideAiPrompt}
                    onChange={e => setIdeAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleIdeAiGenerate())}
                    placeholder={ideAiTarget === 'slide' ? "e.g. Add a 3-column table..." : "e.g. Make it more professional..."}
                    className="w-full bg-[#161618] border-[#333] text-white text-xs min-h-[80px] resize-none pr-10 focus-visible:ring-[#D62828]"
                  />
                  <button 
                    onClick={handleIdeAiGenerate}
                    disabled={isIdeAiLoading || !ideAiPrompt.trim()}
                    className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-[#2d2d30] text-white hover:bg-[#D62828] transition-colors disabled:opacity-50"
                  >
                    {isIdeAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  </button>
               </div>
               {ideAiMode === 'prompt' && (
                  <div className="relative animate-in fade-in duration-300 mt-2">
                     <Textarea 
                       value={ideAiResponse}
                       onChange={e => setIdeAiResponse(e.target.value)}
                       placeholder="Paste AI response here..."
                       className="w-full bg-[#161618] border-[#333] text-gray-400 text-[10px] min-h-[60px] font-mono"
                     />
                     <Button 
                       size="sm" 
                       className="absolute right-2 bottom-2 bg-[#D62828] h-6 text-[9px]"
                       onClick={() => {
                          try {
                            const jsonMatch = ideAiResponse.match(/<json>([\s\S]*?)<\/json>/i) || ideAiResponse.match(/```json\n([\s\S]*?)```/i);
                            const jsonStr = jsonMatch ? jsonMatch[1].trim() : ideAiResponse.trim();
                            const parsed = JSON.parse(jsonStr);
                            if (ideAiTarget === 'slide') {
                               handleUpdateCode(parsed.code || activeSlide?.code);
                               handleUpdateContent(JSON.stringify(parsed.content || activeSlide?.content, null, 2));
                            } else {
                               setDesignConfig({ ...designConfig!, ...parsed });
                            }
                            setIdeAiResponse("");
                          } catch(e) {
                             alert("Invalid response format.");
                          }
                       }}
                     >
                        Apply
                     </Button>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* Design Sidebar (Overlay) */}
      {showDesignSettings && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDesignSettings(false)} />
            <div className="w-96 bg-[#161618] h-full shadow-2xl relative flex flex-col border-l border-[#2d2d30] animate-in slide-in-from-right duration-300">
               <div className="h-16 flex items-center px-6 border-b border-[#2d2d30] justify-between">
                  <h2 className="font-bold text-sm text-white uppercase tracking-widest">Brand System</h2>
                  <button onClick={() => setShowDesignSettings(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Colors */}
                  <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Color Palette</h3>
                     <div className="grid grid-cols-2 gap-4">
                        {[
                           { label: "Primary", key: "primary" },
                           { label: "Secondary", key: "secondary" },
                           { label: "Accent", key: "accent" },
                           { label: "Background", key: "bg" },
                           { label: "Surface", key: "surface" },
                           { label: "Text", key: "textPrimary" },
                        ].map((c) => (
                           <div key={c.key} className="space-y-1.5">
                              <label className="text-[10px] text-gray-500">{c.label}</label>
                              <div className="flex items-center gap-2 bg-[#1a1a1c] p-1.5 rounded-lg border border-[#2d2d30]">
                                 <input 
                                   type="color" 
                                   value={designConfig?.[c.key as keyof DesignConfig] as string} 
                                   onChange={e => setDesignConfig({ ...designConfig!, [c.key]: e.target.value })}
                                   className="w-6 h-6 rounded border-none bg-transparent"
                                 />
                                 <span className="text-[10px] font-mono text-gray-400">{designConfig?.[c.key as keyof DesignConfig] as string}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  {/* Typography */}
                  <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Typography</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] text-gray-500">Heading Font</label>
                           <input 
                             type="text" 
                             value={fontSearch.heading}
                             onChange={e => setFontSearch({ ...fontSearch, heading: e.target.value })}
                             placeholder="Search Google Fonts..."
                             className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg px-3 py-2 text-xs text-white"
                           />
                           <div className="flex flex-wrap gap-2 mt-2">
                              {headingFonts.slice(0, 8).map(f => (
                                 <button 
                                   key={f}
                                   onClick={() => setDesignConfig({ ...designConfig!, headingFont: f })}
                                   className={cn(
                                      "px-2 py-1 text-[10px] rounded border transition-colors",
                                      designConfig?.headingFont === f ? "border-[#D62828] text-white bg-[#D62828]/10" : "border-[#2d2d30] text-gray-500 hover:text-white"
                                   )}
                                 >
                                    {f}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] text-gray-500">Body Font</label>
                           <input 
                             type="text" 
                             value={fontSearch.body}
                             onChange={e => setFontSearch({ ...fontSearch, body: e.target.value })}
                             placeholder="Search Google Fonts..."
                             className="w-full bg-[#1a1a1c] border border-[#2d2d30] rounded-lg px-3 py-2 text-xs text-white"
                           />
                           <div className="flex flex-wrap gap-2 mt-2">
                              {bodyFonts.slice(0, 8).map(f => (
                                 <button 
                                   key={f}
                                   onClick={() => setDesignConfig({ ...designConfig!, fontFamily: f })}
                                   className={cn(
                                      "px-2 py-1 text-[10px] rounded border transition-colors",
                                      designConfig?.fontFamily === f ? "border-[#D62828] text-white bg-[#D62828]/10" : "border-[#2d2d30] text-gray-500 hover:text-white"
                                   )}
                                 >
                                    {f}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-[#2d2d30]">
                  <Button className="w-full bg-[#D62828] text-white h-12" onClick={() => setShowDesignSettings(false)}>Apply Brand Updates</Button>
               </div>
            </div>
         </div>
      )}
      
      {/* Off-screen high-fidelity export container */}
      <div 
        className="fixed pointer-events-none z-[-2000]" 
        style={{ left: '-10000px', top: 0, width: 1280, height: 720, overflow: 'hidden' }} 
        aria-hidden="true"
      >
        {slides.map(slide => (
          <div 
            key={`magic-export-${slide.id}`} 
            id={`magic-export-slide-${slide.id}`} 
            className="w-[1280px] h-[720px] bg-white relative overflow-hidden" 
            style={{ 
              fontFamily: designConfig?.fontFamily ? `"${designConfig.fontFamily}", sans-serif` : 'sans-serif' 
            }}
          >
            <SlideStatic 
              templateCode={slide.code || ""}
              data={slide.content}
              designConfig={designConfig || undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
