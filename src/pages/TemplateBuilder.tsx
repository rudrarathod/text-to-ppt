import React, { useState, useMemo, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore, LayoutDef, LayoutVariant, SlideTemplate } from "../store";
import { SlidePreview } from "../components/SlidePreview";
import { Button, Input, Textarea } from "../components/ui";
import { Plus, Sparkles, Trash2, Code2, Play, CircleAlert, ArrowLeft, X, Mic, Palette, Copy, Check, Edit2, Settings2, ChevronDown, ChevronUp, LayoutTemplate, Download, Search } from "lucide-react";
import { askAiForLayoutCode, buildLayoutPrompt, askAiForFullTemplate, buildFullTemplatePrompt, PromptSettings } from "../lib/gemini";
import { cn } from "../lib/utils";
import Handlebars from "handlebars";
import { PromptSettingsForm, PRESET_PROMPTS } from "../components/PromptSettingsUI";
import { GoogleFontLoader, POPULAR_FONTS } from "../lib/typography";
import { ThemeSettingsPanel } from "../components/design-system/ThemeSettingsPanel";
import { AIAssistantPanel } from "../components/ai/AIAssistantPanel";
import { PageHeader } from "../components/layout/PageHeader";



const SAMPLE_DATA: Record<LayoutVariant, any> = {
  title: { title: "Sample Title Slide", subtitle: "This is a sample subtitle" },
  content: { title: "Key Objectives", points: ["First objective", "Second point of interest", "Final conclusion to discuss."] },
  "image-text": { title: "Visual Growth", description: "Our metrics have consistently trended upwards quarter over quarter, demonstrating the value of our strategic pivot.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" },
  comparison: { title: "Plan Comparison", leftTitle: "Basic Tier", leftPoints: ["Up to 5 Projects", "Community Support", "Basic Analytics"], rightTitle: "Pro Tier", rightPoints: ["Unlimited Projects", "24/7 Priority Support", "Advanced Custom Analytics", "AI Assistant Access"] },
  divider: { section: "Financials" }
};

export function TemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, addLayoutToActiveTemplate, updateLayoutInActiveTemplate, renameLayoutInActiveTemplate, setActiveTemplate, removeLayoutFromActiveTemplate, updateActiveTemplateDesign, renameTemplate } = useAppStore();
  
  const activeTemplate = useMemo(() => templates.find(t => t.id === id), [templates, id]);

  const [isEditingTemplateName, setIsEditingTemplateName] = useState(false);
  const [templateName, setTemplateName] = useState(activeTemplate?.name || "");
  
  React.useEffect(() => {
    if (activeTemplate) {
      setTemplateName(activeTemplate.name);
    }
  }, [activeTemplate?.name]);
  React.useEffect(() => {
    if (id && activeTemplate) {
      setActiveTemplate(id);
    }
  }, [id, activeTemplate, setActiveTemplate]);

  React.useEffect(() => {
    if (!activeTemplate) {
       navigate("/templates");
    }
  }, [activeTemplate, navigate]);

  const layouts = activeTemplate?.layouts || [];
  const designConfig = activeTemplate?.designConfig || templates[0].designConfig;

  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(layouts[0]?.id || null);
  
  const activeLayout = useMemo(() => layouts.find(l => l.id === selectedLayoutId) || layouts[0], [layouts, selectedLayoutId]);
  
  const [workingCode, setWorkingCode] = useState<string>("");
  const [workingJson, setWorkingJson] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'hbs' | 'json'>('hbs');
  const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [editingLayoutName, setEditingLayoutName] = useState<string>("");
  
  // AI assistant state
  const [builderMode, setBuilderMode] = useState<'individual' | 'full'>('individual');
  const [aiMode, setAiMode] = useState<'ai' | 'prompt'>('ai');
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [fullPrompt, setFullPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>({
    mood: "",
    length: "",
    language: "",
    style: "",
    detailLevel: ""
  });
  
  const [parseError, setParseError] = useState<string | null>(null);

  React.useEffect(() => {
    if (layouts.length > 0 && !layouts.find(l => l.id === selectedLayoutId)) {
      setSelectedLayoutId(layouts[0].id);
    }
  }, [layouts, selectedLayoutId]);

  React.useEffect(() => {
    if (activeLayout) {
      setWorkingCode(activeLayout.code);
      setWorkingJson(JSON.stringify(activeLayout.mockData || SAMPLE_DATA[activeLayout.variant] || { title: "Sample" }, null, 2));
      setParseError(null);
    }
  }, [activeLayout?.id, activeLayout?.variant]);

  // Debounced check for Handlebars syntax
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (workingCode) {
           Handlebars.precompile(workingCode);
        }
        setParseError(null);
      } catch (err: any) {
        setParseError(err.message);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [workingCode]);

  const handleSave = () => {
    if (activeLayout) {
      let parsedMock;
      try {
        parsedMock = JSON.parse(workingJson);
      } catch (e) {}

      updateLayoutInActiveTemplate(activeLayout.id, {
        code: workingCode,
        mockData: parsedMock || activeLayout.mockData
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
    addLayoutToActiveTemplate({
      id: newId,
      name: "New Layout",
      variant: "content",
      code: `<!-- Custom Layout -->\n<div class="p-8 bg-lumina-surface h-full w-full">\n  <h1 class="text-4xl text-lumina-primary">{{title}}</h1>\n</div>`
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
        const { code, json } = await askAiForLayoutCode(aiPrompt, workingCode, workingJson, promptSettings);
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
    currentSampleData = JSON.parse(workingJson);
  } catch(e) {
    // keeping default if invalid JSON
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-gray-200 overflow-y-auto lg:overflow-hidden relative">
      <GoogleFontLoader fonts={[designConfig.fontFamily, designConfig.headingFont]} />
      {/* Top Bar for Layout Editor */}
      {/* Top Bar for Layout Editor */}
      <PageHeader 
        backTo="/templates"
        title={
          <div className="flex items-center min-w-0">
            {isEditingTemplateName ? (
              <input 
                autoFocus
                className="bg-transparent border-b border-[#fe6247] outline-none text-white font-bold text-base md:text-lg w-full max-w-xs"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onBlur={() => {
                  if (templateName.trim() && templateName !== activeTemplate.name) {
                    renameTemplate(activeTemplate.id, templateName.trim());
                  }
                  setIsEditingTemplateName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (templateName.trim() && templateName !== activeTemplate.name) {
                      renameTemplate(activeTemplate.id, templateName.trim());
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
                className="font-bold text-white text-base md:text-lg truncate cursor-pointer hover:text-[#fe6247] transition-colors flex items-center gap-2 group max-w-[200px] sm:max-w-xs overflow-hidden text-ellipsis"
                onClick={() => setIsEditingTemplateName(true)}
              >
                {activeTemplate.name}
                <Edit2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>
            )}
            {builderMode === 'individual' && (
              <>
                <span className="opacity-50 mx-2 text-[#85858b]">|</span> 
                <span className="text-[#85858b] truncate text-sm">{activeLayout.name}</span>
              </>
            )}
          </div>
        }
        actions={
          <>
            {/* Builder Mode Toggle */}
            <div className="flex items-center bg-[#111111] rounded-lg p-1 border border-[#2d2d30] shrink-0 mr-4">
               <button 
                 onClick={() => setBuilderMode('individual')} 
                 className={cn("px-3 py-1.5 text-xs sm:text-sm font-bold rounded flex items-center gap-2 transition-colors", builderMode === 'individual' ? "bg-[#252526] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
               >
                 <LayoutTemplate size={14} /> Single Layout
               </button>
               <button 
                 onClick={() => setBuilderMode('full')} 
                 className={cn("px-3 py-1.5 text-xs sm:text-sm font-bold rounded flex items-center gap-2 transition-colors", builderMode === 'full' ? "bg-[#252526] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
               >
                 <Sparkles size={14} /> Full Deck
               </button>
            </div>
            
            <Button onClick={handleExport} variant="outline" className="gap-2 shrink-0 border-[#333] hover:bg-[#252526] text-gray-300 hover:text-white">
               <Download size={16} /> Export
            </Button>
            <Button onClick={() => setShowThemeEditor(!showThemeEditor)} className="gap-2 shrink-0 bg-[#252526] hover:bg-[#2d2d30] text-gray-300 hover:text-white border border-[#333]">
               <Palette size={16} /> Theme
            </Button>
            <Button onClick={handleSave} disabled={workingCode === activeLayout.code && (() => {
              try {
                return JSON.stringify(JSON.parse(workingJson)) === JSON.stringify(activeLayout.mockData || SAMPLE_DATA[activeLayout.variant] || { title: "Sample" });
              } catch(e) { return true; }
            })()} className="gap-2 shrink-0 border-none bg-[#b20112] hover:bg-[#d62828] text-white">
               Save Changes
            </Button>
          </>
        }
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {builderMode === 'individual' ? (
          <>
        {/* Left Panel: Layout Manager */}
        <div className="w-full h-40 md:h-full md:w-64 border-b md:border-b-0 md:border-r border-[#2d2d30] bg-[#161618] flex flex-col shrink-0">
          <div className="p-4 md:p-6 pb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#85858b]">Layouts</span>
            <button onClick={handleAddLayout} className="text-gray-400 hover:text-white transition-colors" title="Add Layout"><Plus size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-row md:flex-col gap-2 md:gap-1 space-y-0 md:space-y-1">
            {layouts.map(l => (
               <div 
                 key={l.id}
                 onClick={() => setSelectedLayoutId(l.id)}
                 className={cn(
                   "px-4 py-2 md:py-3 text-sm rounded-xl cursor-pointer transition-colors font-medium flex items-center justify-between group min-w-[120px] md:min-w-0 shrink-0 border border-[#2d2d30] md:border-transparent",
                   selectedLayoutId === l.id ? "bg-[#2d2d30] text-white font-bold" : "text-[#85858b] hover:bg-[#2d2d30]/50 hover:text-white hover:border-[#333]"
                 )}
               >
                 {editingLayoutId === l.id ? (
                   <input
                     autoFocus
                     value={editingLayoutName}
                     onChange={(e) => setEditingLayoutName(e.target.value)}
                     onBlur={() => {
                        if (editingLayoutName.trim() && editingLayoutName !== l.name) {
                          renameLayoutInActiveTemplate(l.id, editingLayoutName.trim());
                        }
                        setEditingLayoutId(null);
                     }}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          if (editingLayoutName.trim() && editingLayoutName !== l.name) {
                            renameLayoutInActiveTemplate(l.id, editingLayoutName.trim());
                          }
                          setEditingLayoutId(null);
                       } else if (e.key === 'Escape') {
                          setEditingLayoutId(null);
                       }
                     }}
                     className="bg-transparent border-none outline-none text-white w-full shrink min-w-0"
                     onClick={(e) => e.stopPropagation()}
                   />
                 ) : (
                   <>
                     <span className="truncate">{l.name}</span>
                     <div className="flex items-center gap-2">
                       {selectedLayoutId === l.id && workingCode !== l.code && <span className="w-2 h-2 rounded-full bg-[#fe6247]"></span>}
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setEditingLayoutId(l.id);
                           setEditingLayoutName(l.name);
                         }}
                         className="md:opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white p-1 rounded-md transition-colors"
                         title="Rename layout"
                       >
                         <Edit2 size={14} />
                       </button>
                       {layouts.length > 1 && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete layout?")) removeLayoutFromActiveTemplate(l.id); }}
                           className="md:opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#D62828] p-1 rounded-md transition-colors"
                           title="Delete layout"
                         >
                           <Trash2 size={14} />
                         </button>
                       )}
                     </div>
                   </>
                 )}
               </div>
            ))}
          </div>
        </div>

        {/* Center: IDE and Preview Area */}
        <div className="flex-1 flex bg-[#161618] relative overflow-hidden flex-col">
          
          {/* Split View */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full relative">
            <div className="flex flex-col flex-1 lg:flex-none lg:w-1/2 min-w-0 border-b lg:border-b-0 lg:border-r border-[#2d2d30] relative min-h-0">
               <div className="h-12 bg-[#1e1e1e] border-b border-[#2d2d30] text-xs text-[#85858b] flex items-center shrink-0">
                  <div 
                    onClick={() => setActiveTab('hbs')}
                    className={cn(
                      "px-5 border-r border-[#2d2d30] h-full flex items-center gap-2 font-mono cursor-pointer transition-colors",
                      activeTab === 'hbs' ? "bg-[#252526] text-[#e0e0e0]" : "hover:bg-[#252526]/50 hover:text-white text-[#85858b]"
                    )}
                  >
                    <span className="text-[#fe6247]">~</span> {activeLayout.id}.hbs
                  </div>
                  <div 
                    onClick={() => setActiveTab('json')}
                    className={cn(
                      "px-5 border-r border-[#2d2d30] h-full flex items-center gap-2 font-mono cursor-pointer transition-colors",
                      activeTab === 'json' ? "bg-[#252526] text-[#e0e0e0]" : "hover:bg-[#252526]/50 hover:text-white text-[#85858b]"
                    )}
                  >
                    <span className="text-[#47fe90]">~</span> data.json
                  </div>
               </div>
               <div className="flex-1 min-h-0 bg-[#1e1e1e] p-2 relative">
                  {activeTab === 'hbs' ? (
                     <Editor
                       height="100%"
                       defaultLanguage="handlebars"
                       theme="vs-dark"
                       value={workingCode}
                       onChange={(val) => setWorkingCode(val || "")}
                       options={{
                         minimap: { enabled: false },
                         fontSize: 14,
                         wordWrap: "on",
                         padding: { top: 8, bottom: 100 },
                         scrollBeyondLastLine: false,
                       }}
                     />
                  ) : (
                     <Editor
                       height="100%"
                       defaultLanguage="json"
                       theme="vs-dark"
                       value={workingJson}
                       onChange={(val) => setWorkingJson(val || "")}
                       options={{
                         minimap: { enabled: false },
                         fontSize: 14,
                         wordWrap: "on",
                         padding: { top: 8, bottom: 100 },
                         scrollBeyondLastLine: false,
                       }}
                     />
                  )}

                  {/* Floating AI Panel */}
                  <div className="absolute bottom-6 left-6 right-6 z-10 lg:w-[450px]">
                     <AIAssistantPanel 
                       promptValue={aiPrompt}
                       onPromptChange={setAiPrompt}
                       onGenerate={handleAiGenerate}
                       isGenerating={isAiLoading}
                       showPromptSettings={true}
                       promptSettings={promptSettings}
                       onPromptSettingsChange={setPromptSettings}
                       placeholder="e.g., Convert this to a modern 3-column layout..."
                       defaultMode={aiMode}
                       onModeChange={(mode) => setAiMode(mode as 'ai' | 'prompt')}
                       systemPromptBuilder={(p) => buildLayoutPrompt(p, workingCode, workingJson, promptSettings)}
                     />
                     {aiMode === 'prompt' && (
                       <div className="relative mt-2 bg-[#1e1e1e] border border-[#2d2d30] rounded-xl p-2 shadow-2xl">
                         <Textarea 
                           value={aiResponse}
                           onChange={e => setAiResponse(e.target.value)}
                           placeholder="Paste AI generated code here..."
                           className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-3 min-h-[60px]"
                         />
                         <button 
                           onClick={() => {
                             if (aiResponse.trim()) {
                               const slideMatch = aiResponse.match(/<slide>([\s\S]*?)<\/slide>/i);
                               let code = slideMatch ? slideMatch[1].trim() : "";
                               
                               if (!code) {
                                 let match = aiResponse.match(/```(?:html|handlebars)?\n([\s\S]*?)```/);
                                 code = match ? match[1] : aiResponse;
                               }
                               
                               const jsonMatch = aiResponse.match(/<json>([\s\S]*?)<\/json>/i);
                               if (jsonMatch && jsonMatch[1]) {
                                 setWorkingJson(jsonMatch[1].trim());
                               }
                               
                               setWorkingCode(code);
                               setAiResponse("");
                             }
                           }}
                           disabled={!aiResponse.trim()}
                           className="absolute right-3 bottom-3 bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors px-2 py-1 rounded text-xs font-bold"
                         >
                           Apply
                         </button>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="overflow-auto lg:overflow-hidden bg-[#111111] flex items-center justify-center p-4 lg:p-12 relative flex-1 lg:flex-none lg:h-full min-w-0 lg:w-1/2 min-h-[50vh] lg:min-h-0">
              <SlidePreview 
                templateCode={workingCode}
                data={currentSampleData}
                designConfig={designConfig}
                interactive={true}
                onImageUpload={(key, path) => {
                  try {
                    const parsed = JSON.parse(workingJson);
                    parsed[key] = path;
                    setWorkingJson(JSON.stringify(parsed, null, 2));
                  } catch(e) {}
                }}
              />
              {/* Syntax Error overlay */}
              {parseError && (
                <div className="absolute inset-0 bg-[#b20112]/20 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center border-[8px] border-[#b20112] z-10 pointer-events-none">
                   <CircleAlert size={48} className="mb-4 text-[#ffdad6]" />
                   <h3 className="font-bold text-2xl mb-2 text-white">Syntax Error</h3>
                   <p className="font-mono text-sm max-w-lg bg-[#161618] text-red-400 p-6 rounded-xl shadow-2xl overflow-auto text-left leading-relaxed">{parseError}</p>
                </div>
              )}
              
              {/* Theme Settings Sidebar Overlay */}
              {showThemeEditor && (
                 <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#161618] border-l border-[#2d2d30] shadow-2xl flex flex-col z-20">
                   <div className="p-5 border-b border-[#2d2d30] flex items-center justify-between">
                     <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette size={16}/> Theme Settings</h3>
                     <button onClick={() => setShowThemeEditor(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-10">
                      <ThemeSettingsPanel 
                        config={designConfig} 
                        onChange={(updates) => updateActiveTemplateDesign(updates)} 
                        layout="sidebar" 
                      />
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#111111] p-4 lg:p-8 flex flex-col items-center relative">
           <div className="w-full max-w-5xl flex flex-col gap-6">
              
              {/* Generation Card */}
              <div className="bg-[#1e1e1e] border border-[#2d2d30] rounded-xl overflow-hidden shadow-lg mt-4">
                 <div className="px-6 py-5 bg-[#161618] border-b border-[#2d2d30]">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-xl font-bold text-white flex items-center gap-2">
                         <Sparkles className="text-[#D62828]" /> AI Full Template Generator
                       </h3>
                       <div className="flex items-center bg-[#252526] rounded-md border border-[#333] overflow-hidden text-[10px] font-bold text-gray-400">
                         <button onClick={() => setAiMode('ai')} className={cn("px-3 py-1.5 transition-colors", aiMode === 'ai' && "bg-[#2d2d30] text-white")}>AI</button>
                         <button onClick={() => setAiMode('prompt')} className={cn("px-3 py-1.5 transition-colors", aiMode === 'prompt' && "bg-[#2d2d30] text-white")}>Prompt</button>
                       </div>
                    </div>
                    <p className="text-[#85858b] text-sm mb-6">Describe your presentation's purpose to generate a cohesive set of slide layouts.</p>
                    
                    <div className="space-y-4">
                      <PromptSettingsForm settings={promptSettings} setSettings={setPromptSettings} />
                      
                      <div className="relative mt-4">
                         <div className="mb-2">
                           <select 
                             onChange={e => {
                                if (e.target.value !== "custom" && e.target.value !== "") {
                                   setFullPrompt(e.target.value);
                                } else if (e.target.value === "custom") {
                                   if (PRESET_PROMPTS.some(p => p.value === fullPrompt)) {
                                       setFullPrompt("");
                                   }
                                } else {
                                   setFullPrompt("");
                                }
                             }}
                             value={PRESET_PROMPTS.some(p => p.value === fullPrompt) ? fullPrompt : (fullPrompt ? "custom" : "")}
                             className="w-full bg-[#1a1a1c] border border-[#333] text-gray-400 text-sm rounded p-2 outline-none focus:border-[#D62828] font-sans"
                           >
                             <option value="">Start from scratch...</option>
                             {PRESET_PROMPTS.map(p => (
                               <option key={p.label} value={p.value}>{p.label}</option>
                             ))}
                             <option value="custom">Custom details...</option>
                           </select>
                         </div>
                         <Textarea 
                           value={fullPrompt}
                           onChange={e => setFullPrompt(e.target.value)}
                           placeholder="e.g., Create a 5 layout template for a SaaS pitch..."
                           className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-3 min-h-[80px]"
                           disabled={isAiLoading}
                           onKeyDown={(e) => {
                             if(e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               if (aiMode === 'ai') {
                                 handleFullDeckGenerate();
                               } else if (fullPrompt.trim()) {
                                 const instruction = `Please generate a comprehensive set of slide layouts based on the following request:\n${fullPrompt}`;
                                 const simplifiedLayouts = layouts.map(l => ({ id: l.id, name: l.name }));
                                 const fullTextPrompt = buildFullTemplatePrompt(instruction, simplifiedLayouts, promptSettings);
                                 navigator.clipboard.writeText(fullTextPrompt + "\n\nReturn ONLY a JSON array of layouts.");
                                 setCopiedPrompt(true);
                                 setTimeout(() => setCopiedPrompt(false), 2000);
                               }
                             }
                           }}
                         />
                         <div className="flex justify-end mt-4">
                           <Button 
                             onClick={() => {
                               if (aiMode === 'ai') {
                                 handleFullDeckGenerate();
                               } else if (fullPrompt.trim()) {
                                 const instruction = `Please generate a comprehensive set of slide layouts based on the following request:\n${fullPrompt}`;
                                 const simplifiedLayouts = layouts.map(l => ({ id: l.id, name: l.name }));
                                 const fullTextPrompt = buildFullTemplatePrompt(instruction, simplifiedLayouts, promptSettings);
                                 navigator.clipboard.writeText(fullTextPrompt + "\n\nReturn ONLY a JSON array of layouts like [{ name, code, variant }]. No other text.");
                                 setCopiedPrompt(true);
                                 setTimeout(() => setCopiedPrompt(false), 2000);
                               }
                             }}
                             disabled={isAiLoading || !fullPrompt.trim()}
                             className="bg-[#D62828] hover:bg-[#b20112] text-white border-none disabled:opacity-50 flex items-center gap-2"
                           >
                             {isAiLoading ? <span className="animate-pulse">Generating...</span> : (aiMode === 'ai' ? <><Sparkles size={16} /> Generate {layouts.length > 0 ? "Additional " : ""}Layouts</> : (copiedPrompt ? <><Check size={16} className="text-green-500" /> Copied Prompt</> : <><Copy size={16} /> Copy Prompt</>))}
                           </Button>
                         </div>
                      </div>
                      
                      {aiMode === 'prompt' && (
                         <div className="relative mt-4 pt-4 border-t border-[#2d2d30]">
                           <label className="block text-sm font-medium text-gray-400 mb-2">Paste AI Generated JSON:</label>
                           <Textarea 
                             value={aiResponse}
                             onChange={e => setAiResponse(e.target.value)}
                             placeholder="Paste the JSON array of layouts here..."
                             className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-3 min-h-[120px]"
                           />
                           <div className="flex justify-end mt-3">
                             <Button 
                               onClick={() => {
                                 if (aiResponse.trim()) {
                                   try {
                                     let jsonStr = aiResponse;
                                     const jsonMatch = aiResponse.match(/```(?:json)?\n([\s\S]*?)```/i) || aiResponse.match(/<json>\s*([\s\S]*?)\s*<\/json>/i);
                                     if (jsonMatch) {
                                       jsonStr = jsonMatch[1];
                                     } else {
                                       const startIdx = jsonStr.indexOf('[');
                                       const endIdx = jsonStr.lastIndexOf(']');
                                       if (startIdx !== -1 && endIdx !== -1) {
                                          jsonStr = jsonStr.slice(startIdx, endIdx + 1);
                                       }
                                     }
                                     const newLayouts = JSON.parse(jsonStr);
                                     if (Array.isArray(newLayouts) && newLayouts.length > 0) {
                                       let firstNewId: string | null = null;
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
                                       
                                       if (firstNewId) {
                                         setSelectedLayoutId(firstNewId);
                                       }
                                       setAiResponse("");
                                     } else {
                                       alert("Invalid layouts array.");
                                     }
                                   } catch (e: any) {
                                     alert("Failed to parse JSON: " + e.message);
                                   }
                                 }
                               }}
                               disabled={!aiResponse.trim()}
                               className="bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors border-none"
                             >
                               Apply Layouts
                             </Button>
                           </div>
                         </div>
                      )}
                    </div>
                 </div>
              </div>

              {/* Grid of existing layouts */}
              <div className="mt-8 mb-12">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-bold text-[#85858b] uppercase tracking-wider">Current Layouts ({layouts.length})</h4>
                   <Button onClick={() => { handleAddLayout(); setBuilderMode('individual'); }} variant="outline" className="text-xs border-[#333] hover:bg-[#252526] h-8 text-gray-300">
                     <Plus size={14} className="mr-1" /> Add Blank Layout
                   </Button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {layouts.map(l => {
                      let sampleData = l.mockData || SAMPLE_DATA[l.variant] || { title: "Sample" };
                      return (
                        <div key={l.id} className="border border-[#2d2d30] rounded-xl overflow-hidden bg-[#161618] group flex flex-col shadow-md">
                           <div className="aspect-[16/9] w-full relative bg-[#111111] pointer-events-none">
                             <SlidePreview 
                               templateCode={l.code}
                               data={sampleData}
                               designConfig={designConfig}
                               interactive={false}
                             />
                           </div>
                           <div className="p-3 border-t border-[#2d2d30] flex items-center justify-between bg-[#1e1e1e]">
                             <span className="text-sm font-medium text-gray-200 truncate pr-2" title={l.name}>{l.name}</span>
                             <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setSelectedLayoutId(l.id); setBuilderMode('individual'); }} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Edit Layout"><Edit2 size={14} /></button>
                                {layouts.length > 1 && (
                                  <button onClick={() => { if (window.confirm("Delete layout?")) removeLayoutFromActiveTemplate(l.id); }} className="p-1.5 text-gray-400 hover:text-white bg-[#252526] rounded hover:bg-[#D62828] transition-colors" title="Delete Layout"><Trash2 size={14} /></button>
                                )}
                             </div>
                           </div>
                        </div>
                      )
                    })}
                 </div>
              </div>

           </div>
           
           {/* Theme Settings Overlay */}
           {showThemeEditor && (
              <div className="fixed right-0 top-16 bottom-0 w-80 bg-[#161618] border-l border-[#2d2d30] shadow-2xl flex flex-col z-50">
                <div className="p-5 border-b border-[#2d2d30] flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2"><Palette size={16}/> Theme Settings</h3>
                  <button onClick={() => setShowThemeEditor(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-10">
                   {/* Colors Section */}
                   <section className="space-y-4">
                      <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">Core Palette</label>
                      <div className="space-y-3">
                         {[
                           { label: 'Primary', key: 'primary' },
                           { label: 'Secondary', key: 'secondary' },
                           { label: 'Accent', key: 'accent' },
                           { label: 'Surface', key: 'surface' },
                           { label: 'Contrast', key: 'surfaceContrast' },
                           { label: 'Border', key: 'border' },
                         ].map(item => (
                           <div key={item.key} className="flex items-center justify-between group">
                             <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                             <div className="flex items-center gap-2">
                               <div className="relative w-6 h-6 rounded border border-white/10 overflow-hidden">
                                 <input 
                                   type="color" 
                                   value={(designConfig as any)[item.key]} 
                                   onChange={(e) => updateActiveTemplateDesign({ [item.key]: e.target.value })}
                                   className="absolute -inset-2 w-10 h-10 cursor-pointer border-0 p-0"
                                 />
                               </div>
                             </div>
                           </div>
                         ))}
                      </div>
                   </section>

                   {/* Typography Section */}
                   <section className="space-y-4">
                      <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">System Type</label>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 uppercase">Heading Font</span>
                            <select 
                              value={designConfig.headingFont}
                              onChange={(e) => updateActiveTemplateDesign({ headingFont: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                            >
                              {["Inter", "Be Vietnam Pro", "Outfit", "Space Grotesk", "Playfair Display", "JetBrains Mono"].map(f => (
                                <option key={f} value={f} className="bg-[#161618]">{f}</option>
                              ))}
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                               <span className="text-[10px] text-gray-500 uppercase">H-Size</span>
                               <input 
                                 type="text" 
                                 value={designConfig.headingSize}
                                 onChange={(e) => updateActiveTemplateDesign({ headingSize: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                               />
                            </div>
                            <div className="space-y-2">
                               <span className="text-[10px] text-gray-500 uppercase">Weight</span>
                               <input 
                                 type="text" 
                                 value={designConfig.headingWeight}
                                 onChange={(e) => updateActiveTemplateDesign({ headingWeight: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                               />
                            </div>
                         </div>
                      </div>
                   </section>

                   {/* Geometry Section */}
                   <section className="space-y-4">
                      <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">Geometry</label>
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                               <span className="text-[10px] text-gray-500 uppercase">Radius</span>
                               <input 
                                 type="text" 
                                 value={designConfig.cardRadius}
                                 onChange={(e) => updateActiveTemplateDesign({ cardRadius: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                               />
                            </div>
                            <div className="space-y-2">
                               <span className="text-[10px] text-gray-500 uppercase">Spacing</span>
                               <input 
                                 type="text" 
                                 value={designConfig.sectionPadding}
                                 onChange={(e) => updateActiveTemplateDesign({ sectionPadding: e.target.value })}
                                 className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <span className="text-[10px] text-gray-500 uppercase font-medium">Alignment</span>
                            <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                               <button 
                                 onClick={() => updateActiveTemplateDesign({ contentAlignment: 'left' })}
                                 className={cn("py-1 text-[9px] font-black rounded uppercase transition-all", designConfig.contentAlignment === 'left' ? "bg-[#D62828] text-white" : "text-gray-500")}
                               >Left</button>
                               <button 
                                 onClick={() => updateActiveTemplateDesign({ contentAlignment: 'center' })}
                                 className={cn("py-1 text-[9px] font-black rounded uppercase transition-all", designConfig.contentAlignment === 'center' ? "bg-[#D62828] text-white" : "text-gray-500")}
                               >Center</button>
                            </div>
                         </div>
                      </div>
                   </section>
                </div>
              </div>
           )}
        </div>
      )}
      </div>
    </div>
  );
}
