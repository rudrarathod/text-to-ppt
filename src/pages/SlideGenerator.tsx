import React, { useState, useMemo, useEffect } from "react";
import { useAppStore, SlideData } from "../store";
import Editor from "@monaco-editor/react";
import { SlidePreview, SlideStatic } from "../components/SlidePreview";
import { Button, Textarea } from "../components/ui";
import { Download, Plus, Trash2, LayoutTemplate, Sparkles, X, Mic, Copy, Check, Settings2, ChevronDown, ChevronUp, Save, Loader2, Palette, Code2, Presentation as PresentationIcon, Layout as LayoutIcon, ArrowLeft, Play, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { cn } from "../lib/utils";
import { askAiForSlideContent, buildSlideContentPrompt, askAiForFullPresentation, buildPresentationPrompt, PromptSettings, askAiForLayoutCode, buildLayoutPrompt } from "../lib/gemini";

const IMAGE_PLACEHOLDER = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%25' height='100%25'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Cpath stroke='%239ca3af' stroke-width='4' stroke-dasharray='10,10' d='M20 20 h360 v260 h-360 z' fill='none'/%3E%3Ccircle cx='200' cy='120' r='40' fill='%23d1d5db'/%3E%3Cpath d='M200 160 l50 -50 l80 80 v90 h-260 v-40 l60 -60 z' fill='%23d1d5db'/%3E%3Ctext x='50%25' y='85%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3EImage Placeholder%3C/text%3E%3C/svg%3E";

import { PromptSettingsForm, MOOD_OPTIONS, LANGUAGE_OPTIONS, LENGTH_OPTIONS, STYLE_OPTIONS, PRESET_PROMPTS, SINGLE_SLIDE_PROMPTS, DETAIL_OPTIONS, SelectOrCustom } from "../components/PromptSettingsUI";

const extractDefaultContent = (layoutCode: string, existingContent: Record<string, any> = {}) => {
  const regex = /\{\{\{?\s*(?:[#^]?(?:if|each|unless)\s+)?([a-zA-Z0-9_]+)\s*\}\}\}?/g;
  const newKeys = new Set<string>();
  let match;
  while ((match = regex.exec(layoutCode)) !== null) {
      if (match[1] !== 'this' && match[1] !== 'else') newKeys.add(match[1]);
  }
  
  const newContent: Record<string, any> = {};
  Array.from(newKeys).forEach(key => {
      if (existingContent[key] !== undefined) {
          newContent[key] = existingContent[key];
      } else {
          if (key === 'points') newContent[key] = ["Point 1", "Point 2"];
          else if (key.toLowerCase().includes('title')) newContent[key] = existingContent.title || "New Title";
          else if (key.toLowerCase().includes('image') || key.toLowerCase().includes('logo') || key.toLowerCase().includes('pic') || key.toLowerCase().includes('photo')) newContent[key] = IMAGE_PLACEHOLDER;
          else newContent[key] = `New ${key}`;
      }
      
      // Also upgrade existing empty strings for image keys to the placeholder
      if ((key.toLowerCase().includes('image') || key.toLowerCase().includes('logo') || key.toLowerCase().includes('pic') || key.toLowerCase().includes('photo')) && newContent[key] === "") {
        newContent[key] = IMAGE_PLACEHOLDER;
      }
  });
  if (!newContent.title && existingContent.title) newContent.title = existingContent.title;
  return newContent;
};

import { useParams, useNavigate } from "react-router-dom";

export function SlideGenerator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { templates, presentations, activePresentationId, setSlides, addSlide, removeSlide, updateSlideContent, updateSlideLayout, setActiveTemplate, setPresentationTemplate, setActivePresentation } = useAppStore();
  
  useEffect(() => {
    if (id && id !== activePresentationId) {
      if (presentations.some(p => p.id === id)) {
        setActivePresentation(id);
      } else {
        navigate("/");
      }
    } else if (!id && activePresentationId) {
      navigate(`/presentations/${activePresentationId}`);
    }
  }, [id, activePresentationId, presentations, setActivePresentation, navigate]);

  const activePresentation = presentations.find(p => p.id === (id || activePresentationId));
  const slides = activePresentation?.slides || [];
  const activeTemplateId = activePresentation?.templateId || "t-default";
  
  const activeTemplate = useMemo(() => templates.find(t => t.id === activeTemplateId) || templates[0], [templates, activeTemplateId]);
  const layouts = activeTemplate.layouts;
  const designConfig = activeTemplate.designConfig;

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(slides[0]?.id || null);

  // Sync selection if current slide is deleted
  useEffect(() => {
    if (slides.length > 0) {
      if (!selectedSlideId || !slides.some(s => s.id === selectedSlideId)) {
        setSelectedSlideId(slides[0].id);
      }
    } else {
      setSelectedSlideId(null);
    }
  }, [slides, selectedSlideId]);

  const selectedSlide = useMemo(() => slides.find(s => s.id === selectedSlideId), [slides, selectedSlideId]);
  const activeLayout = useMemo(() => {
    if (!selectedSlide) return null;
    return layouts.find(l => l.id === selectedSlide.layoutId) || layouts[0];
  }, [layouts, selectedSlide]);

  const [jsonInput, setJsonInput] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");

  const [aiMode, setAiMode] = useState<'ai' | 'prompt'>('ai');
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'design' | 'content'>('design');
  const [isEditingLayoutCode, setIsEditingLayoutCode] = useState(false);
  const [layoutEditCode, setLayoutEditCode] = useState("");
  const [layoutAiPrompt, setLayoutAiPrompt] = useState("");
  const [isLayoutAiLoading, setIsLayoutAiLoading] = useState(false);
  const [layoutAiMode, setLayoutAiMode] = useState<'ai' | 'prompt'>('ai');
  const [layoutAiResponse, setLayoutAiResponse] = useState("");
  const [tempJsonInput, setTempJsonInput] = useState<string | null>(null);
  const [layoutEditorSubTab, setLayoutEditorSubTab] = useState<'code' | 'data'>('code');

  const [generatorMode, setGeneratorMode] = useState<'individual' | 'presentation'>('individual');
  const [deckAiMode, setDeckAiMode] = useState<'ai' | 'prompt'>('ai');
  const [deckAiResponse, setDeckAiResponse] = useState("");
  const [presentationPrompt, setPresentationPrompt] = useState("");
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);
  
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: ""
  });

  const handleGeneratePresentation = async () => {
    if (!presentationPrompt.trim()) return;
    setIsGeneratingPresentation(true);
    try {
      const layoutsArray = activeTemplate.layouts.map(l => ({id: l.id, name: l.name, code: l.code}));
      const generatedSlides = await askAiForFullPresentation(presentationPrompt, layoutsArray, promptSettings);
      
      if (generatedSlides && generatedSlides.length > 0) {
        const newSlides = generatedSlides.map(s => ({
           id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
           templateId: activeTemplate.id,
           layoutId: s.layoutId || layouts[0].id,
           content: s.content || {}
        }));
        
        setSlides(newSlides);
        if (newSlides.length > 0) {
           setSelectedSlideId(newSlides[0].id);
        }
        setPresentationPrompt("");
        setGeneratorMode('individual');
      } else {
        alert("AI could not generate a valid presentation. Please try a different prompt.");
      }
    } catch (e: any) {
      alert("Presentation Generation failed: " + e.message);
    } finally {
      setIsGeneratingPresentation(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !activeLayout || !selectedSlideId) return;
    setIsAiLoading(true);
    try {
      const newJsonString = await askAiForSlideContent(aiPrompt, activeLayout.code, jsonInput, promptSettings);
      if (newJsonString) {
        setJsonInput(newJsonString);
        try {
          const parsed = JSON.parse(newJsonString);
          updateSlideContent(selectedSlideId, parsed);
          setJsonError("");
        } catch(e: any) {
          setJsonError("AI generated invalid JSON: " + e.message);
        }
      }
      setAiPrompt("");
    } catch (e: any) {
      alert("AI Generation failed: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedSlide) {
      setJsonInput(JSON.stringify(selectedSlide.content, null, 2));
      setJsonError("");
    }
  }, [selectedSlide?.id]); // only refresh when slide changes, not when content changes from other sources

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setJsonInput(newVal);
    if (!selectedSlideId) return;

    try {
      const parsed = JSON.parse(newVal);
      setJsonError("");
      updateSlideContent(selectedSlideId, parsed);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleAddSlide = () => {
    const layoutId = layouts[0]?.id || "";
    const layoutCode = layouts[0]?.code || "";
    const newSlide: SlideData = {
      id: `s-${Date.now()}`,
      layoutId: layoutId,
      content: extractDefaultContent(layoutCode, { title: "New Slide" })
    };
    addSlide(newSlide);
    setSelectedSlideId(newSlide.id);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // Zustand persists state automatically, so we just provide visual feedback
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportPDF = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720]
      });

      for (let i = 0; i < slides.length; i++) {
        setExportProgress(Math.round((i / slides.length) * 100));
        const slide = slides[i];
        const element = document.getElementById(`export-slide-${slide.id}`);
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
          console.warn("Capture failed:", err);
          continue;
        }
        
        if (!imgData) continue;
        if (i > 0) pdf.addPage([1280, 720], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1280, 720, undefined, "FAST");
      }
      setExportProgress(100);
      pdf.save(`${activePresentation?.name || "Presentation"}.pdf`);
    } catch (e) {
      console.error("Export Error:", e);
      alert("Failed to export PDF.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };



  const previewData = useMemo(() => {
    if (selectedSlide && isEditingLayoutCode && tempJsonInput) {
      try { return JSON.parse(tempJsonInput); } catch(e) { return selectedSlide.content; }
    }
    return selectedSlide?.content || {};
  }, [selectedSlide, isEditingLayoutCode, tempJsonInput]);

  const handleLayoutAiGenerate = async () => {
    if (!layoutAiPrompt.trim() || !activeLayout) return;
    setIsLayoutAiLoading(true);
    try {
      const { code, json } = await askAiForLayoutCode(layoutAiPrompt, layoutEditCode, tempJsonInput || jsonInput, designConfig, promptSettings);
      setLayoutEditCode(code);
      if (json) {
        setTempJsonInput(json);
      }
      setLayoutAiPrompt("");
    } catch (e: any) {
      alert("AI Generation failed: " + e.message);
    } finally {
      setIsLayoutAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#111111] text-gray-200 overflow-y-auto lg:overflow-hidden relative">
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
                 <p className="text-gray-400">Please wait while we render your slides with high fidelity...</p>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                 <div 
                   className="h-full bg-gradient-to-r from-[#D62828] to-[#fe6247] transition-all duration-500 ease-out shadow-[0_0_15px_rgba(214,40,40,0.5)]" 
                   style={{ width: `${exportProgress}%` }}
                 />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Slide {Math.ceil((exportProgress / 100) * slides.length)} of {slides.length}</p>
           </div>
        </div>
      )}

      {/* Left Panel: Thumbnails */}
      <div className={cn(
        "h-32 lg:h-full bg-[#161618] border-b lg:border-b-0 lg:border-r border-[#2d2d30] flex flex-col shrink-0 transition-all duration-500 overflow-hidden",
        isEditingLayoutCode ? "w-0 opacity-0 border-r-0 pointer-events-none" : "w-full lg:w-64 opacity-100"
      )}>
        <div className="p-3 lg:p-4 border-b border-[#2d2d30] flex items-center justify-between shrink-0">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">Slides <span className="bg-[#2d2d30] text-xs px-2 py-0.5 rounded-full">{slides.length}</span></h2>
          <Button onClick={handleAddSlide} variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]" title="Add Slide"><Plus size={16} /></Button>
        </div>
        <div className="flex-1 overflow-x-auto lg:overflow-x-hidden overflow-y-hidden lg:overflow-y-auto p-3 lg:p-4 flex flex-row lg:flex-col gap-3 lg:gap-4">
          {slides.map((s, idx) => {
            const l = layouts.find(x => x.id === s.layoutId);
            return (
              <div 
                key={s.id}
                onClick={() => setSelectedSlideId(s.id)}
                className={cn(
                  "relative group cursor-pointer border-2 rounded-xl aspect-video w-[140px] lg:w-full flex-shrink-0 flex flex-col bg-[#1e1e1e] transition-all overflow-hidden",
                  selectedSlideId === s.id ? "border-[#D62828] shadow-lg shadow-[#D62828]/20 ring-1 ring-[#D62828]/20" : "border-[#2d2d30] hover:border-[#3d3d40]"
                )}
              >
                {/* Visual Preview Area */}
                <div 
                  className="flex-1 flex items-center justify-center p-2 text-center"
                  style={{ backgroundColor: designConfig.bg }}
                >
                   <div 
                     className="line-clamp-2 text-[10px] font-bold leading-tight"
                     style={{ color: designConfig.primary }}
                   >
                     {s.content.title || "Untitled Slide"}
                   </div>
                </div>

                {/* Footer with meta info */}
                <div className="h-7 border-t border-[#2d2d30] px-2 flex items-center justify-between bg-[#161618]">
                   <span className="text-[9px] font-bold text-gray-500">{idx + 1}</span>
                   <span className="text-[8px] text-gray-500 uppercase tracking-tighter opacity-70 truncate max-w-[60px]">{l?.variant || "Slide"}</span>
                </div>

                {/* Delete button (only show if not the last slide for better UX, or just always on hover) */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.confirm("Delete this slide?")) {
                      removeSlide(s.id); 
                    }
                  }}
                  className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center bg-black/60 hover:bg-[#b20112] text-white rounded-md opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                  title="Delete Slide"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden relative">
        <div className="h-14 lg:h-16 border-b border-[#2d2d30] bg-[#161618] flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <span className="font-bold text-white text-base lg:text-lg truncate block min-w-0">
              <span className="text-gray-400 font-normal mr-2">{activePresentation?.name || "Presentation"}</span>
              / <span className="ml-2">{selectedSlide?.content.title || "Untitled"}</span>
            </span>
            <div className="h-6 w-px bg-[#333] hidden sm:block shrink-0"></div>
            <select 
              value={activeTemplateId}
              onChange={(e) => setPresentationTemplate(activePresentationId!, e.target.value)}
              className="text-xs lg:text-sm border border-[#2d2d30] bg-[#1e1e1e] text-white rounded-lg px-2 lg:px-3 py-1 lg:py-1.5 outline-none focus:ring-2 focus:ring-[#D62828] w-[120px] sm:w-[150px] shrink-0"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button 
              onClick={handleSave} 
              variant="outline"
              className="gap-2 shrink-0 h-8 lg:h-10 text-xs lg:text-sm px-3 border-[#333] hover:bg-[#252526] text-gray-300 transition-colors"
            >
              {isSaved ? <><Check size={14} className="text-green-500" /> <span className="hidden sm:inline text-green-500">Saved</span></> : <><Save size={14} /> <span className="hidden sm:inline">Save</span></>}
            </Button>
            <Button 
              onClick={() => navigate(`/presentations/${activePresentationId}/present`)}
              className="gap-2 border-[#333] hover:bg-[#2d2d30] shrink-0 h-8 lg:h-10 text-xs lg:text-sm px-3 bg-[#1c1c1e] text-white transition-colors border"
            >
              <Play size={14} className="fill-current" /> <span className="hidden sm:inline">Present</span>
            </Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="gap-2 border-none shrink-0 h-8 lg:h-10 text-xs lg:text-sm px-3 bg-[#D62828] hover:bg-[#b20112] text-white transition-colors shadow-lg"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> <span className="hidden sm:inline">Export</span> PDF</>}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4 lg:p-12 bg-[#111111] relative min-h-[50vh] lg:min-h-0">
          {selectedSlide && activeLayout ? (
             <SlidePreview 
               templateCode={isEditingLayoutCode ? layoutEditCode : (activeLayout?.code || "")} 
               data={previewData} 
               designConfig={designConfig}
               interactive={true}
               onImageUpload={(key, path) => {
                 if (isEditingLayoutCode) {
                   try {
                     const current = tempJsonInput ? JSON.parse(tempJsonInput) : selectedSlide.content;
                     const next = { ...current, [key]: path };
                     setTempJsonInput(JSON.stringify(next, null, 2));
                   } catch(e) {}
                 } else {
                   const newContent = { ...selectedSlide.content, [key]: path };
                   updateSlideContent(selectedSlide.id, newContent);
                   setJsonInput(JSON.stringify(newContent, null, 2));
                 }
               }}
             />
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <LayoutTemplate size={48} className="mb-4 opacity-50" />
              <p>Select a slide to preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: JSON Editor & Layout Selector */}
      <div className={cn(
        "h-[50vh] lg:h-full bg-[#161618] border-t lg:border-t-0 lg:border-l border-[#2d2d30] flex flex-col shrink-0 relative lg:min-h-0 transition-all duration-500 ease-in-out",
        isEditingLayoutCode ? "lg:w-[500px]" : "lg:w-80 w-full"
      )}>
        <div className="p-4 lg:p-6 pb-4 shrink-0 border-b border-[#2d2d30] bg-[#161618]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
               <Settings2 size={16} className="text-[#D62828]" /> Slide Details
            </h3>
            <div className="flex bg-[#111111] rounded-lg p-1 border border-[#2d2d30]">
               <button onClick={() => setGeneratorMode('individual')} className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", generatorMode === 'individual' ? "bg-[#252526] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}>Single</button>
               <button onClick={() => setGeneratorMode('presentation')} className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", generatorMode === 'presentation' ? "bg-[#252526] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}>Deck</button>
            </div>
          </div>

          {generatorMode === 'individual' && (
            <div className="flex p-1 bg-[#111111] rounded-xl border border-[#2d2d30]">
               <button 
                 onClick={() => setActiveSidebarTab('design')}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                   activeSidebarTab === 'design' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/20" : "text-gray-500 hover:text-white"
                 )}
               >
                 <Palette size={14} /> Design
               </button>
               <button 
                 onClick={() => setActiveSidebarTab('content')}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                   activeSidebarTab === 'content' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/20" : "text-gray-500 hover:text-white"
                 )}
               >
                 <Code2 size={14} /> Content
               </button>
            </div>
          )}
        </div>
        
        {generatorMode === 'presentation' ? (
           <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0 relative">
              <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                   Presentation Prompt
                   <button onClick={() => setShowPromptSettings(!showPromptSettings)} title="Prompt Settings" className={cn("text-[#85858b] hover:text-white transition-colors", showPromptSettings && "text-white")}>
                     <Settings2 size={12} />
                   </button>
                 </label>
                 <div className="flex items-center bg-[#252526] rounded-md border border-[#333] overflow-hidden text-[9px] font-bold text-gray-400">
                     <button onClick={() => setDeckAiMode('ai')} className={cn("px-2 py-1 transition-colors", deckAiMode === 'ai' && "bg-[#2d2d30] text-white")}>AI</button>
                     <button onClick={() => setDeckAiMode('prompt')} className={cn("px-2 py-1 transition-colors", deckAiMode === 'prompt' && "bg-[#2d2d30] text-white")}>Prompt</button>
                 </div>
              </div>
              {showPromptSettings && (
                 <div className="mb-3 p-3 bg-[#1e1e1e] border border-[#2d2d30] rounded-xl">
                   <span className="text-[10px] font-bold text-white uppercase opacity-50">Settings</span>
                   <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                 </div>
              )}
              <div className="relative">
                <div className="mb-2">
                   <select 
                     onChange={e => {
                        if (e.target.value !== "custom" && e.target.value !== "") {
                           setPresentationPrompt(e.target.value);
                        } else if (e.target.value === "custom") {
                           if (PRESET_PROMPTS.some(p => p.value === presentationPrompt)) {
                               setPresentationPrompt("");
                           }
                        } else {
                           setPresentationPrompt("");
                        }
                     }}
                     value={PRESET_PROMPTS.some(p => p.value === presentationPrompt) ? presentationPrompt : (presentationPrompt ? "custom" : "")}
                     className="w-full bg-[#1e1e1e] border border-[#2d2d30] text-gray-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#D62828] font-sans"
                   >
                     <option value="">Start from scratch...</option>
                     {PRESET_PROMPTS.map(p => (
                       <option key={p.label} value={p.value}>{p.label}</option>
                     ))}
                     <option value="custom">Custom details...</option>
                   </select>
                </div>
                <Textarea 
                  value={presentationPrompt}
                  onChange={e => setPresentationPrompt(e.target.value)}
                  placeholder="e.g. Create a 5-slide pitch deck for a new AI startup..."
                  className="w-full bg-[#1e1e1e] border-[#2d2d30] text-gray-200 text-sm focus-visible:ring-[#D62828] font-sans rounded-xl p-3 min-h-[150px] mb-4 resize-none pr-10"
                  disabled={isGeneratingPresentation}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (deckAiMode === 'ai') {
                        handleGeneratePresentation();
                      } else if (presentationPrompt.trim()) {
                        const layoutsArray = activeTemplate.layouts.map(l => ({id: l.id, name: l.name, code: l.code}));
                        const fullPrompt = buildPresentationPrompt(presentationPrompt, layoutsArray, promptSettings);
                        navigator.clipboard.writeText(fullPrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (deckAiMode === 'ai') {
                      handleGeneratePresentation();
                    } else if (presentationPrompt.trim()) {
                      const layoutsArray = activeTemplate.layouts.map(l => ({id: l.id, name: l.name, code: l.code}));
                      const fullPrompt = buildPresentationPrompt(presentationPrompt, layoutsArray, promptSettings);
                      navigator.clipboard.writeText(fullPrompt);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }
                  }}
                  disabled={isGeneratingPresentation || !presentationPrompt.trim()}
                  className="absolute right-3 bottom-7 text-[#5c403d] hover:text-[#D62828] disabled:opacity-50 transition-colors bg-[#161618] p-1.5 rounded"
                  title={deckAiMode === 'ai' ? "Generate Full Deck" : "Copy Prompt"}
                >
                  {isGeneratingPresentation ? <span className="animate-pulse">...</span> : (deckAiMode === 'ai' ? <Sparkles size={16} /> : (copiedPrompt ? <Check size={16} className="text-green-500" /> : <Copy size={16} />))}
                </button>
              </div>

              {deckAiMode === 'prompt' && (
                <div className="relative flex-1 flex flex-col mt-2">
                  <Textarea 
                     value={deckAiResponse}
                     onChange={e => setDeckAiResponse(e.target.value)}
                     placeholder="Paste AI generated JSON array here..."
                     className="w-full bg-[#1e1e1e] border-[#2d2d30] text-gray-200 text-xs focus-visible:ring-[#D62828] font-mono resize-none rounded-xl p-3 pb-12 flex-1"
                  />
                  <Button 
                     onClick={() => {
                       if (deckAiResponse.trim()) {
                         try {
                           let jsonStr = deckAiResponse;
                           const jsonMatch = deckAiResponse.match(/<json>([\s\S]*?)<\/json>/i);
                           if (jsonMatch && jsonMatch[1]) {
                             jsonStr = jsonMatch[1].trim();
                           } else {
                             const markdownMatch = deckAiResponse.match(/```json\n([\s\S]*?)```/i);
                             if (markdownMatch && markdownMatch[1]) {
                               jsonStr = markdownMatch[1].trim();
                             }
                           }
                           const parsed = JSON.parse(jsonStr);
                           if (Array.isArray(parsed)) {
                             const newSlides = parsed.map((s: any) => ({
                               id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                               templateId: activeTemplate.id,
                               layoutId: s.layoutId || layouts[0].id,
                               content: s.content || {}
                             }));
                             setSlides(newSlides);
                             if (newSlides.length > 0) {
                               setSelectedSlideId(newSlides[0].id);
                             }
                             setDeckAiResponse("");
                             setGeneratorMode('individual');
                           } else {
                             alert("Pasted JSON is not an array of slides.");
                           }
                         } catch(e: any) {
                           alert("Invalid JSON pasted: " + e.message);
                         }
                       }
                     }}
                     disabled={!deckAiResponse.trim()}
                     className="absolute right-3 bottom-3 bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors h-8 text-xs font-bold"
                  >
                     Apply JSON
                  </Button>
                </div>
              )}
           </div>
        ) : selectedSlide ? (
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {activeSidebarTab === 'design' ? (
              <div className="p-6 space-y-6 h-full flex flex-col min-h-0">
                {isEditingLayoutCode ? (
                  <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => {
                           setIsEditingLayoutCode(false);
                           setTempJsonInput(null);
                         }}
                           className="p-1.5 hover:bg-[#252526] rounded-lg text-gray-400 hover:text-white transition-colors"
                         >
                           <ArrowLeft size={14} />
                         </button>
                         <div className="flex bg-[#111111] rounded-lg p-1 border border-[#2d2d30] ml-2">
                            <button 
                              onClick={() => setLayoutEditorSubTab('code')} 
                              className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", layoutEditorSubTab === 'code' ? "bg-[#D62828] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
                            >
                              Code
                            </button>
                            <button 
                              onClick={() => setLayoutEditorSubTab('data')} 
                              className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", layoutEditorSubTab === 'data' ? "bg-[#D62828] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
                            >
                              Data
                            </button>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => {
                            if (activeLayout) {
                              (useAppStore.getState() as any).updateLayoutInActiveTemplate(activeLayout.id, { code: layoutEditCode });
                              if (tempJsonInput) {
                                try {
                                  const parsed = JSON.parse(tempJsonInput);
                                  setJsonInput(tempJsonInput);
                                  updateSlideContent(selectedSlideId!, parsed);
                                } catch(e) {}
                              }
                              setIsEditingLayoutCode(false);
                              setTempJsonInput(null);
                            }
                          }}
                          className="h-7 text-[10px] px-4 bg-[#D62828] hover:bg-[#b20112] text-white font-bold"
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 rounded-2xl overflow-hidden border border-[#2d2d30] bg-[#1e1e1e] mb-20 relative shadow-2xl">
                       {layoutEditorSubTab === 'code' ? (
                         <Editor
                           height="100%"
                           defaultLanguage="handlebars"
                           theme="vs-dark"
                           value={layoutEditCode}
                           onChange={(val) => setLayoutEditCode(val || "")}
                           options={{
                             minimap: { enabled: false },
                             fontSize: 12,
                             wordWrap: "on",
                             padding: { top: 12 },
                             scrollBeyondLastLine: false,
                             lineNumbers: "on",
                             fontFamily: "JetBrains Mono, monospace"
                           }}
                         />
                       ) : (
                         <Editor
                           height="100%"
                           defaultLanguage="json"
                           theme="vs-dark"
                           value={tempJsonInput || ""}
                           onChange={(val) => setTempJsonInput(val || "")}
                           options={{
                             minimap: { enabled: false },
                             fontSize: 12,
                             wordWrap: "on",
                             padding: { top: 12 },
                             scrollBeyondLastLine: false,
                             lineNumbers: "on",
                             fontFamily: "JetBrains Mono, monospace"
                           }}
                         />
                       )}
                    </div>

                    {/* Layout AI Assistant Panel */}
                    <div className="absolute bottom-6 left-6 right-6 bg-[#161618] border border-[#2d2d30] rounded-2xl shadow-2xl flex flex-col shrink-0 overflow-hidden z-20">
                       <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d30] bg-[#1c1c1e]">
                         <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-lg bg-[#fe6247]/10 flex items-center justify-center">
                             <Sparkles size={12} className="text-[#fe6247] animate-pulse" />
                           </div>
                           <span className="text-white text-[11px] font-black uppercase tracking-widest">Layout AI</span>
                           <div className="flex items-center bg-[#111111] rounded-md border border-[#2d2d30] overflow-hidden text-[9px] font-bold text-gray-500 p-0.5">
                             <button onClick={() => setLayoutAiMode('ai')} className={cn("px-2 py-1 rounded transition-all", layoutAiMode === 'ai' ? "bg-[#252526] text-white shadow-sm" : "hover:text-gray-300")}>Auto</button>
                             <button onClick={() => setLayoutAiMode('prompt')} className={cn("px-2 py-1 rounded transition-all", layoutAiMode === 'prompt' ? "bg-[#252526] text-white shadow-sm" : "hover:text-gray-300")}>Draft</button>
                           </div>
                         </div>
                         <button onClick={() => setShowPromptSettings(!showPromptSettings)} title="Prompt Settings" className={cn("text-gray-500 hover:text-white transition-colors", showPromptSettings && "text-[#fe6247]")}>
                            <Settings2 size={14} />
                         </button>
                       </div>
                       
                       {showPromptSettings && (
                         <div className="px-3 pb-3 border-b border-[#2d2d30] bg-[#1a1a1a]">
                           <span className="text-[10px] font-bold text-white uppercase opacity-50 block mt-2">Settings</span>
                           <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                         </div>
                       )}
                       
                       <div className="p-2 space-y-2">
                         <div className="relative">
                           <Textarea 
                             value={layoutAiPrompt}
                             onChange={e => setLayoutAiPrompt(e.target.value)}
                             placeholder="e.g. Add a 3-column feature list with icons..."
                             className="w-full bg-[#252526] border border-[#333] text-gray-200 text-xs focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-2 pr-8 min-h-[50px]"
                             disabled={isLayoutAiLoading}
                             onKeyDown={(e) => {
                               if(e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 if (layoutAiMode === 'ai') {
                                   handleLayoutAiGenerate();
                                 } else if (layoutAiPrompt.trim()) {
                                   const fullPrompt = buildLayoutPrompt(layoutAiPrompt, layoutEditCode, jsonInput, designConfig, promptSettings);
                                   navigator.clipboard.writeText(fullPrompt);
                                   setCopiedPrompt(true);
                                   setTimeout(() => setCopiedPrompt(false), 2000);
                                 }
                               }
                             }}
                           />
                           <button 
                             onClick={() => {
                               if (layoutAiMode === 'ai') {
                                 handleLayoutAiGenerate();
                               } else if (layoutAiPrompt.trim()) {
                                 const fullPrompt = buildLayoutPrompt(layoutAiPrompt, layoutEditCode, jsonInput, designConfig, promptSettings);
                                 navigator.clipboard.writeText(fullPrompt);
                                 setCopiedPrompt(true);
                                 setTimeout(() => setCopiedPrompt(false), 2000);
                               }
                             }}
                             disabled={isLayoutAiLoading || !layoutAiPrompt.trim()}
                             className="absolute right-2 bottom-2 text-[#5c403d] hover:text-[#fe6247] disabled:opacity-50 transition-colors bg-[#1e1e1e] p-1 rounded"
                             title={layoutAiMode === 'ai' ? "Generate with AI" : "Copy Prompt"}
                           >
                             {isLayoutAiLoading ? <span className="animate-pulse flex items-center justify-center p-0.5">...</span> : (layoutAiMode === 'ai' ? <Sparkles size={14} /> : (copiedPrompt ? <Check size={14} className="text-green-500" /> : <Copy size={14} />))}
                           </button>
                         </div>
                         {layoutAiMode === 'prompt' && (
                           <div className="relative mt-1">
                             <Textarea 
                               value={layoutAiResponse}
                               onChange={e => setLayoutAiResponse(e.target.value)}
                               placeholder="Paste JSON/Code here..."
                               className="w-full bg-[#252526] border border-[#333] text-gray-200 text-xs focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-2 pb-8 min-h-[50px]"
                             />
                             <button 
                               onClick={() => {
                                 if (layoutAiResponse.trim()) {
                                   const slideMatch = layoutAiResponse.match(/<slide>([\s\S]*?)<\/slide>/i);
                                   let code = slideMatch ? slideMatch[1].trim() : "";
                                   
                                   if (!code) {
                                     let match = layoutAiResponse.match(/```(?:html|handlebars)?\n([\s\S]*?)```/);
                                     code = match ? match[1] : layoutAiResponse;
                                   }
                                   
                                   const jsonMatch = layoutAiResponse.match(/<json>([\s\S]*?)<\/json>/i);
                                   if (jsonMatch && jsonMatch[1]) {
                                      setTempJsonInput(jsonMatch[1].trim());
                                   }
                                   
                                   setLayoutEditCode(code);
                                   setLayoutAiResponse("");
                                 }
                               }}
                               disabled={!layoutAiResponse.trim()}
                               className="absolute right-2 bottom-2 bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors px-2 py-0.5 rounded text-[10px] font-bold"
                             >
                               Apply
                             </button>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Layout Library</label>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => {
                               if (activeLayout) {
                                 setLayoutEditCode(activeLayout.code);
                                 setTempJsonInput(jsonInput);
                                 setIsEditingLayoutCode(true);
                               }
                             }}
                             className="text-[10px] font-bold text-gray-400 hover:text-[#fe6247] transition-colors flex items-center gap-1.5 px-2 py-1 bg-[#1c1c1e] rounded-md border border-[#2d2d30]"
                           >
                             <Code2 size={12} /> Edit Code
                           </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {layouts.map(l => (
                           <div 
                             key={l.id}
                             onClick={() => {
                               const newLayout = layouts.find(x => x.id === l.id);
                               if (newLayout && selectedSlide) {
                                 const newContent = extractDefaultContent(newLayout.code, selectedSlide.content);
                                 updateSlideLayout(selectedSlide.id, l.id);
                                 updateSlideContent(selectedSlide.id, newContent);
                                 setJsonInput(JSON.stringify(newContent, null, 2));
                               }
                             }}
                             className={cn(
                               "group relative p-4 rounded-2xl cursor-pointer transition-all border flex flex-col gap-3",
                               selectedSlide.layoutId === l.id 
                                 ? "bg-[#D62828]/5 border-[#D62828] shadow-lg shadow-[#D62828]/5" 
                                 : "bg-[#1c1c1e] border-[#2d2d30] hover:border-[#444] hover:bg-[#252526]"
                             )}
                           >
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className={cn(
                                     "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                     selectedSlide.layoutId === l.id ? "bg-[#D62828] text-white" : "bg-[#2d2d30] text-gray-400 group-hover:text-white"
                                   )}>
                                     {l.variant === 'title' && <PresentationIcon size={14} />}
                                     {l.variant === 'content' && <LayoutIcon size={14} />}
                                     {l.variant === 'image-text' && <Sparkles size={14} />}
                                     {l.variant === 'comparison' && <ArrowLeft size={14} className="rotate-180" />}
                                     {l.variant === 'divider' && <Plus size={14} />}
                                   </div>
                                   <div>
                                     <h4 className="text-xs font-bold text-white mb-0.5">{l.name}</h4>
                                     <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">{l.variant}</p>
                                   </div>
                                </div>
                                {selectedSlide.layoutId === l.id && (
                                   <div className="w-5 h-5 rounded-full bg-[#D62828] flex items-center justify-center">
                                      <Check size={12} className="text-white" />
                                   </div>
                                )}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6 flex flex-col h-full space-y-6">
                <div className="flex-1 flex flex-col min-h-0">
                   <div className="flex items-center justify-between mb-4">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                       Data Structure
                     </label>
                     <button 
                       onClick={() => {
                         try {
                           const parsed = JSON.parse(jsonInput);
                           setJsonInput(JSON.stringify(parsed, null, 2));
                         } catch(e) {}
                       }}
                       className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                     >
                        Format
                     </button>
                   </div>
                   
                   <div className="relative flex-1 min-h-[300px]">
                     <Textarea 
                       className="font-mono text-[11px] w-full h-full leading-relaxed bg-[#111111] border-[#2d2d30] text-gray-300 focus-visible:ring-[#D62828] rounded-2xl p-4 resize-none shadow-inner border shadow-black/20" 
                       value={jsonInput}
                       onChange={handleJsonChange}
                       spellCheck={false}
                     />
                     {jsonError && (
                       <div className="absolute bottom-4 left-4 right-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         <p className="text-[9px] text-red-400 font-mono bg-red-950/80 backdrop-blur-md p-3 rounded-xl border border-red-500/30 shadow-2xl">{jsonError}</p>
                       </div>
                     )}
                   </div>
                </div>
                <div className="h-32 shrink-0"></div> {/* Spacer for fixed AI panel */}
              </div>
            )}

            {/* AI Assistant fixed to bottom inside Right Panel */}
            {generatorMode === 'individual' && selectedSlide && (
            <div className={cn(
              "absolute bottom-6 left-6 right-6 bg-[#161618] border border-[#2d2d30] rounded-2xl shadow-2xl flex flex-col shrink-0 overflow-hidden z-20 transition-all duration-500",
              activeSidebarTab === 'content' ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
            )}>
               <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d30] bg-[#1c1c1e]">
                 <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg bg-[#D62828]/10 flex items-center justify-center">
                     <Sparkles size={12} className="text-[#D62828] animate-pulse" />
                   </div>
                   <span className="text-white text-[11px] font-black uppercase tracking-widest">AI Designer</span>
                   <div className="flex items-center bg-[#111111] rounded-md border border-[#2d2d30] overflow-hidden text-[9px] font-bold text-gray-500 p-0.5">
                     <button onClick={() => setAiMode('ai')} className={cn("px-2 py-1 rounded transition-all", aiMode === 'ai' ? "bg-[#252526] text-white shadow-sm" : "hover:text-gray-300")}>Auto</button>
                     <button onClick={() => setAiMode('prompt')} className={cn("px-2 py-1 rounded transition-all", aiMode === 'prompt' ? "bg-[#252526] text-white shadow-sm" : "hover:text-gray-300")}>Draft</button>
                   </div>
                 </div>
                 <button onClick={() => setShowPromptSettings(!showPromptSettings)} title="Prompt Settings" className={cn("text-gray-500 hover:text-white transition-colors", showPromptSettings && "text-[#D62828]")}>
                    <Settings2 size={14} />
                 </button>
               </div>
               
               {showPromptSettings && (
                 <div className="px-3 pb-3 border-b border-[#2d2d30] bg-[#1a1a1a]">
                   <span className="text-[10px] font-bold text-white uppercase opacity-50 block mt-2">Settings</span>
                   <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                 </div>
               )}
               
               <div className="p-2 space-y-2">
                 <div className="relative">
                   <div className="mb-2">
                     <select 
                       onChange={e => {
                          if (e.target.value !== "custom" && e.target.value !== "") {
                             setAiPrompt(e.target.value);
                          } else if (e.target.value === "custom") {
                             if (SINGLE_SLIDE_PROMPTS.some(p => p.value === aiPrompt)) {
                                 setAiPrompt("");
                             }
                          } else {
                             setAiPrompt("");
                          }
                       }}
                       value={SINGLE_SLIDE_PROMPTS.some(p => p.value === aiPrompt) ? aiPrompt : (aiPrompt ? "custom" : "")}
                       className="w-full bg-[#1a1a1c] border border-[#333] text-gray-400 text-[10px] rounded p-1.5 outline-none focus:border-[#D62828] font-sans"
                     >
                       <option value="">Start from scratch...</option>
                       {SINGLE_SLIDE_PROMPTS.map(p => (
                         <option key={p.label} value={p.value}>{p.label}</option>
                       ))}
                       <option value="custom">Custom topic...</option>
                     </select>
                   </div>
                   <Textarea 
                     value={aiPrompt}
                     onChange={e => setAiPrompt(e.target.value)}
                     placeholder="e.g. Generate 3 key points..."
                     className="w-full bg-[#252526] border border-[#333] text-gray-200 text-xs focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-2 pr-8 min-h-[50px]"
                     disabled={isAiLoading}
                     onKeyDown={(e) => {
                       if(e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         if (aiMode === 'ai') {
                           handleAiGenerate();
                         } else if (aiPrompt.trim()) {
                           const fullPrompt = buildSlideContentPrompt(aiPrompt, activeLayout?.code || "", jsonInput, promptSettings);
                           navigator.clipboard.writeText(fullPrompt);
                           setCopiedPrompt(true);
                           setTimeout(() => setCopiedPrompt(false), 2000);
                         }
                       }
                     }}
                   />
                   <button 
                     onClick={() => {
                       if (aiMode === 'ai') {
                         handleAiGenerate();
                       } else if (aiPrompt.trim()) {
                         const fullPrompt = buildSlideContentPrompt(aiPrompt, activeLayout?.code || "", jsonInput, promptSettings);
                         navigator.clipboard.writeText(fullPrompt);
                         setCopiedPrompt(true);
                         setTimeout(() => setCopiedPrompt(false), 2000);
                       }
                     }}
                     disabled={isAiLoading || !aiPrompt.trim()}
                     className="absolute right-2 bottom-2 text-[#5c403d] hover:text-[#D62828] disabled:opacity-50 transition-colors bg-[#1e1e1e] p-1 rounded"
                     title={aiMode === 'ai' ? "Generate with AI" : "Copy Prompt"}
                   >
                     {isAiLoading ? <span className="animate-pulse flex items-center justify-center p-0.5"><Mic size={14} className="opacity-0"/>...</span> : (aiMode === 'ai' ? <Sparkles size={14} /> : (copiedPrompt ? <Check size={14} className="text-green-500" /> : <Copy size={14} />))}
                   </button>
                 </div>
                 {aiMode === 'prompt' && (
                   <div className="relative mt-1">
                     <Textarea 
                       value={aiResponse}
                       onChange={e => setAiResponse(e.target.value)}
                       placeholder="Paste JSON here..."
                       className="w-full bg-[#252526] border border-[#333] text-gray-200 text-xs focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-2 pb-8 min-h-[50px]"
                     />
                     <button 
                       onClick={() => {
                         if (aiResponse.trim()) {
                           const jsonMatch = aiResponse.match(/<json>([\s\S]*?)<\/json>/i);
                           let jsonStr = jsonMatch ? jsonMatch[1].trim() : aiResponse;
                           if (!jsonMatch) {
                               const markdownMatch = aiResponse.match(/```json\n([\s\S]*?)```/i);
                               jsonStr = markdownMatch ? markdownMatch[1].trim() : aiResponse.trim();
                           }
                           setJsonInput(jsonStr);
                           try {
                             const parsed = JSON.parse(jsonStr);
                             updateSlideContent(selectedSlideId!, parsed);
                             setJsonError("");
                           } catch(e: any) {
                             setJsonError("Invalid JSON pasted: " + e.message);
                           }
                           setAiResponse("");
                         }
                       }}
                       disabled={!aiResponse.trim()}
                       className="absolute right-2 bottom-2 bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors px-2 py-0.5 rounded text-[10px] font-bold"
                     >
                       Apply
                     </button>
                   </div>
                 )}
               </div>
            </div>
            )}

          </div>
        ) : (
           <div className="p-4 text-sm text-[#85858b] text-center">
             No slide selected.
           </div>
        )}
      </div>
      
      {/* Hidden Export Container - Positioned off-screen but NOT display:none or opacity-0 */}
      <div 
        className="fixed pointer-events-none z-[-1000]" 
        style={{ left: '-10000px', top: 0, width: 1280, height: 720, overflow: 'hidden' }} 
        aria-hidden="true"
      >
        {slides.map(slide => {
          const layout = layouts.find(l => l.id === slide.layoutId) || layouts[0];
          return (
            <div 
              key={`export-${slide.id}`} 
              id={`export-slide-${slide.id}`} 
              className="w-[1280px] h-[720px] bg-white relative overflow-hidden" 
              style={{ 
                fontFamily: designConfig?.fontFamily ? `"${designConfig.fontFamily}", sans-serif` : 'sans-serif' 
              }}
            >
              <SlideStatic 
                templateCode={layout?.code || ""}
                data={slide.content}
                designConfig={designConfig}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
