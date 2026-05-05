import { useState } from "react";
import { useAppStore, DesignConfig } from "../store";
import { Button } from "../components/ui";
import { Plus, Presentation as PresentationIcon, Trash2, Edit2, Sparkles, Loader2, Copy, Check, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";
import { askAiForDesignConfig, askAiForFullPresentation, buildDesignConfigPrompt, buildPresentationPrompt, PromptSettings } from "../lib/gemini";
import { PromptSettingsForm } from "../components/PromptSettingsUI";

export function PresentationGallery() {
  const { presentations, activePresentationId, createPresentation, deletePresentation, setActivePresentation, templates, createTemplate, updateActiveTemplateDesign, setSlides } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [magicPrompt, setMagicPrompt] = useState("");
  const [magicAiResponse, setMagicAiResponse] = useState("");
  const [isGeneratingMagic, setIsGeneratingMagic] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [aiMode, setAiMode] = useState<'ai' | 'prompt'>('ai');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: ""
  });
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const templateIdToUse = selectedTemplateId || templates[0]?.id || "t-default";
    const newId = createPresentation(newTitle, templateIdToUse);
    setActivePresentation(newId);
    setShowCreateModal(false);
    setNewTitle("");
    navigate(`/presentations/${newId}`);
  };

  const handleMagicGenerate = async () => {
    if (!magicPrompt.trim() || isGeneratingMagic) return;
    setIsGeneratingMagic(true);
    
    try {
      // 1. Generate Design Config
      const newDesignConfig = await askAiForDesignConfig(magicPrompt, promptSettings);
      
      // 2. Create the presentation and template (using default layouts but new design)
      const defaultLayouts = templates[0]?.layouts || [];
      const newTemplateId = createTemplate(`${magicPrompt.substring(0, 20)} Theme`, newDesignConfig || undefined);
      
      const newId = createPresentation(magicPrompt.substring(0, 40) || "AI Generated PPT", newTemplateId);
      setActivePresentation(newId);

      // 3. Generate Slides using the layouts
      const newSlidesInfo = await askAiForFullPresentation(magicPrompt, defaultLayouts, promptSettings);
      
      if (newSlidesInfo && newSlidesInfo.length > 0) {
        const generatedSlides = newSlidesInfo.map((s: any) => ({
          id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          layoutId: s.layoutId || defaultLayouts[0].id,
          content: s.content || {}
        }));
        // Use setSlides in store to update the generated slides for this presentation
        setSlides(generatedSlides);
      }
      
      setShowMagicModal(false);
      setMagicPrompt("");
      navigate(`/presentations/${newId}`);
    } catch (e) {
      console.error(e);
      alert("Error generating presentation");
    } finally {
      setIsGeneratingMagic(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!magicPrompt.trim()) return;
    const defaultLayouts = templates[0]?.layouts || [];
    const designPrompt = buildDesignConfigPrompt(magicPrompt, promptSettings);
    const layoutsArray = defaultLayouts.map((l: any) => ({id: l.id, name: l.name, code: l.code}));
    const slidesPrompt = buildPresentationPrompt(magicPrompt, layoutsArray, promptSettings);
    
    const combinedPrompt = `=== DESIGN SYSTEM PROMPT ===\n${designPrompt}\n\n=== SLIDES PROMPT ===\n${slidesPrompt}`;
    navigator.clipboard.writeText(combinedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleProcessMagicResponse = () => {
    if (!magicAiResponse.trim()) return;
    
    try {
      let designConfigStr = "";
      let slidesStr = "";
      
      const jsonBlocks = Array.from(magicAiResponse.matchAll(/<json>([\s\S]*?)<\/json>/gi)).map(m => m[1].trim());
      
      if (jsonBlocks.length >= 2) {
         designConfigStr = jsonBlocks[0];
         slidesStr = jsonBlocks[1];
      } else {
         const mdBlocks = Array.from(magicAiResponse.matchAll(/```json\n([\s\S]*?)```/gi)).map(m => m[1].trim());
         if (mdBlocks.length >= 2) {
            designConfigStr = mdBlocks[0];
            slidesStr = mdBlocks[1];
         } else if (jsonBlocks.length === 1) {
             slidesStr = jsonBlocks[0];
         } else if (mdBlocks.length === 1) {
             slidesStr = mdBlocks[0];
         } else {
             slidesStr = magicAiResponse;
         }
      }
      
      let newDesignConfig;
      try {
         if (designConfigStr) {
            const parsedDesign = JSON.parse(designConfigStr);
            if (!Array.isArray(parsedDesign)) newDesignConfig = parsedDesign;
         }
      } catch(e) { console.warn("Could not parse design config", e); }
      
      let parsedSlides = [];
      try {
         parsedSlides = JSON.parse(slidesStr);
      } catch(e) { throw new Error("Could not parse slides JSON array."); }
      
      if (!Array.isArray(parsedSlides)) throw new Error("Slides must be an array.");

      const defaultLayouts = templates[0]?.layouts || [];
      const newTemplateId = createTemplate(`${magicPrompt.substring(0, 20)} Theme`, newDesignConfig || undefined);
      
      const newId = createPresentation(magicPrompt.substring(0, 40) || "Imported AI Presentation", newTemplateId);
      setActivePresentation(newId);

      const generatedSlides = parsedSlides.map((s: any) => ({
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        layoutId: s.layoutId || defaultLayouts[0].id,
        content: s.content || {}
      }));
      
      setSlides(generatedSlides);
      
      setShowMagicModal(false);
      setMagicPrompt("");
      setMagicAiResponse("");
      navigate(`/presentations/${newId}`);
      
    } catch (err: any) {
       alert("Error processing response: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] overflow-auto text-gray-200">
      <div className="h-auto md:h-16 py-4 md:py-0 border-b border-[#2d2d30] flex flex-col md:flex-row items-center justify-between px-8 bg-[#161618] shrink-0 sticky top-0 z-10 w-full shadow-sm gap-4 relative">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <PresentationIcon className="text-white" size={24} />
          <h2 className="font-bold text-white text-lg">Presentations</h2>
        </div>
      </div>

      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {presentations.map(presentation => {
            const currentTemplate = templates.find(t => t.id === presentation.templateId);
            return (
              <div 
                key={presentation.id} 
                className="group relative bg-[#1e1e1e] border border-[#2d2d30] rounded-xl overflow-hidden hover:border-[#D62828] transition-all flex flex-col h-[280px] shadow-lg hover:shadow-[#D62828]/10"
              >
                {/* Visual Preview Area */}
                <div 
                   className="h-44 bg-[#161618] relative overflow-hidden flex items-center justify-center p-0 border-b border-[#2d2d30] cursor-pointer"
                   onClick={() => {
                     setActivePresentation(presentation.id);
                     navigate(`/presentations/${presentation.id}`);
                   }}
                >
                   <div 
                     className="w-full h-full relative flex items-center justify-center transition-transform group-hover:scale-105 duration-500"
                     style={{
                        backgroundColor: currentTemplate?.designConfig.bg || '#fff',
                     }}
                   >
                     {/* Preview placeholder - Slide 1 title */}
                     <h3 
                       className="text-center font-bold px-6 line-clamp-3 text-xl drop-shadow-sm pointer-events-none"
                       style={{ color: currentTemplate?.designConfig.primary || '#000' }}
                     >
                        {presentation.slides[0]?.content.title || presentation.name}
                     </h3>
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-[#D62828] hover:bg-[#b20112] text-white border-none shadow-xl gap-2 font-bold px-6 py-2 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none">
                          <Edit2 size={16} /> Edit Presentation
                        </Button>
                     </div>
                   </div>
                </div>

                {/* Delete button floating outside the main clickable area for better events */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${presentation.name}"?`)) {
                      deletePresentation(presentation.id);
                    }
                  }}
                  className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-black/50 hover:bg-[#b20112] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
                  title="Delete Presentation"
                >
                  <Trash2 size={14} />
                </button>

                {/* Card Info Area */}
                <div className="p-4 flex flex-col gap-2 bg-[#1e1e1e] flex-1">
                   <div className="flex items-center justify-between">
                     <h3 
                       className="font-bold text-white truncate text-base hover:text-[#D62828] transition-colors cursor-pointer" 
                       title={presentation.name}
                       onClick={() => {
                         setActivePresentation(presentation.id);
                         navigate(`/presentations/${presentation.id}`);
                       }}
                     >
                       {presentation.name}
                     </h3>
                   </div>
                   <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                     <div className="flex items-center gap-2">
                       <span className="bg-[#2d2d30] px-2 py-0.5 rounded text-gray-300">{presentation.slides.length} Slides</span>
                       <span>&bull;</span>
                       <span>{formatDistanceToNow(presentation.updatedAt, { addSuffix: true })}</span>
                     </div>
                     <span className="text-[10px] text-gray-600 bg-gray-400/5 px-2 py-0.5 rounded border border-gray-400/10">
                        {currentTemplate?.name || "No Template"}
                     </span>
                   </div>
                </div>
              </div>
            );
          })}

          {/* Create New Card */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-[#2d2d30] rounded-xl flex flex-col items-center justify-center p-8 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-500/10 transition-all cursor-pointer min-h-[260px] bg-[#161618]"
          >
             <div className="w-16 h-16 rounded-full bg-[#2d2d30] flex items-center justify-center mb-5 group-hover:bg-gray-500 shadow-sm transition-colors">
               <Plus size={32} className="text-gray-400 group-hover:text-white" />
             </div>
             <p className="font-bold font-display text-xl text-white">Manual Presentation</p>
          </div>

          {/* Magic AI Generate Card */}
          <div 
            onClick={() => navigate("/magic-builder")}
            className="border-2 border-dashed border-[#D62828]/50 rounded-xl flex flex-col items-center justify-center p-8 text-gray-500 hover:text-white hover:border-[#D62828] hover:bg-[#D62828]/10 transition-all cursor-pointer min-h-[260px] bg-[#161618] group"
          >
             <div className="w-16 h-16 rounded-full bg-[#D62828]/20 flex items-center justify-center mb-5 group-hover:bg-[#D62828] shadow-sm transition-colors">
               <Sparkles size={32} className="text-[#D62828] group-hover:text-white" />
             </div>
             <p className="font-bold font-display text-xl text-white">Auto Magic Generate</p>
             <p className="text-xs text-center mt-2 text-gray-500 group-hover:text-gray-300">Generate design & slides instantly</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-[#2d2d30] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2d2d30]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PresentationIcon size={20}/>
                New Presentation
              </h3>
            </div>
            <div className="p-6">
                <div>
                  <label className="block text-xs font-bold text-[#85858b] uppercase tracking-wider mb-2">Presentation Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#161618] border border-[#333] text-white rounded-lg px-4 py-2 outline-none focus:border-[#D62828] transition-colors"
                    placeholder="E.g., Q3 Marketing Plan..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-[#85858b] uppercase tracking-wider mb-2">Select Template</label>
                  <select 
                    value={selectedTemplateId} 
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-[#161618] border border-[#333] text-white rounded-lg px-4 py-2 outline-none focus:border-[#D62828] transition-colors"
                  >
                    <option value="">Default (Lumina Velocity)</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-[#333] hover:bg-[#252526] text-gray-300">
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!newTitle.trim()} className="bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold">
                    Create Presentation
                  </Button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showMagicModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-[#D62828]/30 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#2d2d30]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-[#D62828]"/>
                Magic AI Generate
              </h3>
              <div className="flex items-center gap-3">
                 <button onClick={() => setShowPromptSettings(!showPromptSettings)} title="Prompt Settings" className={cn("text-[#85858b] hover:text-white transition-colors", showPromptSettings && "text-white")}>
                   <Settings2 size={16} />
                 </button>
                 <div className="flex items-center bg-[#252526] rounded-md border border-[#333] overflow-hidden text-[10px] font-bold text-gray-400">
                    <button onClick={() => setAiMode('ai')} className={cn("px-2 py-1 transition-colors", aiMode === 'ai' && "bg-[#2d2d30] text-white")}>AI</button>
                    <button onClick={() => setAiMode('prompt')} className={cn("px-2 py-1 transition-colors", aiMode === 'prompt' && "bg-[#2d2d30] text-white")}>Prompt</button>
                 </div>
              </div>
            </div>
            <div className="p-6">
                {showPromptSettings && (
                   <div className="mb-4 p-3 bg-[#161618] border border-[#2d2d30] rounded-xl">
                     <span className="text-[10px] font-bold text-white uppercase opacity-50 block mb-2">Settings</span>
                     <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                   </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#85858b] uppercase tracking-wider mb-2">What is your presentation about?</label>
                  <textarea
                    value={magicPrompt}
                    onChange={(e) => setMagicPrompt(e.target.value)}
                    className="w-full bg-[#161618] border border-[#333] text-white rounded-lg px-4 py-3 outline-none focus:border-[#D62828] transition-colors min-h-[100px] resize-none"
                    placeholder="E.g., A minimalist pitch deck for a new sustainable coffee brand..."
                    autoFocus
                    disabled={isGeneratingMagic}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    We will automatically generate a custom design system and populate the initial slides based on your prompt.
                  </p>
                </div>
                
                {aiMode === 'prompt' && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-[#85858b] uppercase tracking-wider mb-2">Paste AI Response</label>
                    <textarea
                      value={magicAiResponse}
                      onChange={(e) => setMagicAiResponse(e.target.value)}
                      className="w-full bg-[#161618] border border-[#333] text-gray-200 text-xs font-mono rounded-lg px-4 py-3 outline-none focus:border-[#D62828] transition-colors min-h-[120px] resize-none"
                      placeholder="Paste the AI's generated JSON response here..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                  <Button variant="outline" onClick={() => setShowMagicModal(false)} disabled={isGeneratingMagic} className="border-[#333] hover:bg-[#252526] text-gray-300">
                    Cancel
                  </Button>
                  {aiMode === 'ai' ? (
                     <Button onClick={handleMagicGenerate} disabled={!magicPrompt.trim() || isGeneratingMagic} className="bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold min-w-[140px]">
                        {isGeneratingMagic ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Generating...
                          </>
                        ) : 'Generate Magic'}
                     </Button>
                  ) : (
                     <div className="flex gap-2">
                         <Button onClick={handleCopyPrompt} disabled={!magicPrompt.trim()} className="bg-[#2d2d30] hover:bg-[#333] text-white border-none font-bold min-w-[140px] flex items-center gap-2">
                            {copiedPrompt ? <Check size={16} className="text-white" /> : <Copy size={16} className="text-white" />}
                            {copiedPrompt ? 'Copied Prompts!' : 'Copy Prompts'}
                         </Button>
                         <Button onClick={handleProcessMagicResponse} disabled={!magicAiResponse.trim()} className="bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold min-w-[140px] flex items-center gap-2">
                            Process Result
                         </Button>
                     </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
