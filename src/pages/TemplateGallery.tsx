import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { Button, Textarea } from "../components/ui";
import { Plus, LayoutTemplate, Trash2, Edit2, X, Download, Upload, Copy, Palette, ChevronRight, Sparkles, Wand2, Loader2, Check, Settings2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { askAiForDesignConfig, buildDesignConfigPrompt } from "../lib/gemini";
import { GoogleFontLoader, POPULAR_FONTS } from "../lib/typography";
import { ThemeSettingsPanel } from "../components/design-system/ThemeSettingsPanel";
import { AIAssistantPanel } from "../components/ai/AIAssistantPanel";
import { PageHeader } from "../components/layout/PageHeader";
import { PreviewCard } from "../components/layout/PreviewCard";



const RealtimePreview = ({ config }: { config: any }) => {
  return (
    <div className="space-y-6 w-full">
      <GoogleFontLoader fonts={[config.fontFamily, config.headingFont]} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse shrink-0"></div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate">System Preview</h4>
           </div>
           <div className="hidden sm:block h-3 w-px bg-white/10 shrink-0"></div>
           <span className="hidden sm:block text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">{config.headingFont} System</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
             <div className="w-1 h-1 rounded-full bg-white/20"></div>
             <div className="w-1 h-1 rounded-full bg-white/40"></div>
             <div className="w-1 h-1 rounded-full bg-white/60"></div>
          </div>
          <span className="text-[9px] text-gray-500 font-mono">ACTIVE</span>
        </div>
      </div>

      <div 
        className="rounded-[40px] border border-white/5 p-6 lg:p-10 aspect-[4/3] flex flex-col gap-6 overflow-hidden shadow-2xl transition-all duration-700 ease-in-out relative group/preview"
        style={{ backgroundColor: config.bg }}
      >
        {/* Engineering Grid */}
        <div 
           className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `radial-gradient(${config.primary} 1px, transparent 1px), linear-gradient(to right, ${config.primary} 1px, transparent 1px), linear-gradient(to bottom, ${config.primary} 1px, transparent 1px)`,
             backgroundSize: '20px 20px, 40px 40px, 40px 40px'
           }}
        ></div>

        {/* Layered Content System */}
        <div className="grid grid-cols-12 gap-2 lg:gap-4 flex-1 min-h-0">
           {/* Primary Brand Card */}
           <div 
             className="col-span-8 flex flex-col p-4 lg:p-8 gap-4 transition-all duration-500 shadow-2xl border overflow-hidden"
             style={{ 
               backgroundColor: config.surface,
               borderRadius: config.cardRadius,
               borderColor: config.border,
               boxShadow: config.shadowStrong,
               textAlign: config.contentAlignment
             }}
           >
             <div className="space-y-2 lg:space-y-4 flex-1 flex flex-col justify-center min-h-0">
               <div className="flex items-center gap-2 mb-1 lg:mb-2" style={{ justifyContent: config.contentAlignment === 'center' ? 'center' : 'flex-start' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.primary }}>
                     <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest" style={{ color: config.primary }}>Brand V0.1</span>
               </div>
               <h1 
                 className="tracking-tighter leading-[1] max-w-[12ch] break-words" 
                 style={{ 
                   color: config.textPrimary, 
                   fontFamily: config.headingFont,
                   fontWeight: config.headingWeight,
                   fontSize: `clamp(16px, calc(${config.headingSize} * 0.45), 48px)`,
                   letterSpacing: config.letterSpacing,
                   margin: config.contentAlignment === 'center' ? '0 auto' : '0'
                 }}
               >
                 Future <span style={{ color: config.primary }}>Standard</span> Design.
               </h1>
               <p 
                 className="opacity-70 font-medium leading-relaxed max-w-[32ch] line-clamp-3" 
                 style={{ 
                   color: config.textSecondary,
                   fontFamily: config.fontFamily,
                   fontSize: `calc(${config.bodySize} * 0.75)`,
                   margin: config.contentAlignment === 'center' ? '0 auto' : '0'
                 }}
               >
                 Unifying typography and color into a cohesive visual language.
               </p>
             </div>
             
             <div className={cn(
               "flex flex-wrap gap-2 lg:gap-3 mt-auto", 
               config.contentAlignment === 'center' ? "justify-center" : "justify-start"
             )}>
               <div 
                 className="px-4 py-2 lg:px-6 lg:py-2.5 text-white text-[10px] lg:text-[11px] font-black shadow-lg cursor-default border border-transparent whitespace-nowrap"
                 style={{ 
                   backgroundColor: config.primary, 
                   borderRadius: config.buttonRadius,
                   boxShadow: config.shadowSoft
                 }}
               >
                 Launch App
               </div>
               <div 
                 className="px-4 py-2 lg:px-6 lg:py-2.5 text-[10px] lg:text-[11px] font-black cursor-default border-2 transition-all whitespace-nowrap"
                 style={{ 
                   borderColor: config.border, 
                   color: config.textPrimary, 
                   borderRadius: config.buttonRadius 
                 }}
               >
                 Documentation
               </div>
             </div>
           </div>

           {/* Sidebar Component Grid */}
           <div className="col-span-4 flex flex-col gap-2 lg:gap-4 overflow-hidden">
              {/* Type Spec */}
              <div 
                className="flex-1 p-3 lg:p-5 border flex flex-col justify-between overflow-hidden"
                style={{ 
                  backgroundColor: config.surfaceContrast, 
                  borderRadius: config.cardRadius,
                  borderColor: config.border
                }}
              >
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Type System</p>
                     <h3 className="text-sm font-black truncate" style={{ color: config.textPrimary, fontFamily: config.headingFont }}>{config.headingFont}</h3>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-end gap-1 overflow-hidden">
                        <span className="text-xl lg:text-3xl font-black truncate" style={{ color: config.primary, fontFamily: config.headingFont }}>Ab</span>
                        <span className="text-[8px] lg:text-[10px] pb-1 opacity-50 shrink-0" style={{ color: config.textPrimary }}>900/400</span>
                     </div>
                     <div className="h-px bg-black/5 w-full my-1 lg:my-2"></div>
                     <p className="text-[8px] lg:text-[9px] leading-tight opacity-60 line-clamp-2" style={{ color: config.textSecondary }}>The quick brown fox jumps over the lazy dog.</p>
                  </div>
              </div>

              {/* Palette Mini */}
              <div 
                className="lg:h-28 p-3 lg:p-5 border flex flex-col justify-between shrink-0"
                style={{ 
                  backgroundColor: config.surfaceContrast, 
                  borderRadius: config.cardRadius,
                  borderColor: config.border
                }}
              >
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 lg:mb-0">Palette</p>
                 <div className="flex gap-1 lg:gap-1.5 mt-auto">
                    {[config.primary, config.secondary, config.accent].map((c, i) => (
                       <div key={i} className="flex-1 aspect-square rounded-md shadow-sm border border-black/5" style={{ backgroundColor: c }}></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Global Progress Bar */}
        <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden flex">
           <div className="h-full transition-all duration-1000" style={{ backgroundColor: config.primary, width: '45%' }}></div>
           <div className="h-full transition-all duration-1000 opacity-50" style={{ backgroundColor: config.secondary, width: '25%' }}></div>
           <div className="h-full transition-all duration-1000 opacity-20" style={{ backgroundColor: config.accent, width: '30%' }}></div>
        </div>
      </div>
    </div>
  );
};

export function TemplateGallery() {
  const { templates, createTemplate, deleteTemplate, setActiveTemplate, importTemplate, duplicateTemplate } = useAppStore();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newTemplateName, setNewTemplateName] = useState("My New Template");
  const [designEntryMode, setDesignEntryMode] = useState<'auto' | 'manual'>('auto');
  const [aiMode, setAiMode] = useState<'ai' | 'prompt'>('ai');
  const [aiDesignPrompt, setAiDesignPrompt] = useState("");
  const [aiResponseText, setAiResponseText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [designConfig, setDesignConfig] = useState({
    primary: '#1c1c1e',
    primaryHover: '#2c2c2e',
    secondary: '#D62828',
    accent: '#007AFF',
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceContrast: '#E5E5EA',
    textPrimary: '#000000',
    textSecondary: '#8E8E93',
    fontFamily: 'Inter',
    headingFont: 'Inter',
    headingWeight: '900',
    headingSize: '4rem',
    bodySize: '1.25rem',
    letterSpacing: '-0.02em',
    borderRadius: '1.5rem',
    buttonRadius: '0.75rem',
    cardRadius: '2rem',
    border: '#D1D1D6',
    sectionPadding: '5rem',
    contentAlignment: 'center' as 'left' | 'center',
    shadowSoft: '0 4px 20px rgba(0,0,0,0.05)',
    shadowStrong: '0 10px 40px rgba(0,0,0,0.08)',
    transitionSpeed: '300ms',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTemplateName.trim()) {
      const id = createTemplate(newTemplateName.trim(), designConfig);
      setShowCreateModal(false);
      setCreateStep(1);
      setNewTemplateName("My New Template");
      setAiDesignPrompt("");
      navigate(`/templates/${id}`);
    }
  };

  const handleAiDesignGenerate = async () => {
    if (!aiDesignPrompt.trim()) return;
    setIsGeneratingDesign(true);
    try {
      const config = await askAiForDesignConfig(aiDesignPrompt);
      if (config) {
        setDesignConfig(prev => ({
          ...prev,
          ...config
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleCopyPrompt = () => {
    const prompt = buildDesignConfigPrompt(aiDesignPrompt || newTemplateName);
    navigator.clipboard.writeText(prompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleApplyAiResponse = () => {
    try {
      const jsonMatch = aiResponseText.match(/<json>([\s\S]*?)<\/json>/i) || aiResponseText.match(/```json\n([\s\S]*?)```/i);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : aiResponseText.trim();
      const config = JSON.parse(jsonStr);
      if (config) {
        setDesignConfig(prev => ({ ...prev, ...config }));
        setAiResponseText("");
      }
    } catch (err) {
      alert("Invalid JSON response. Please make sure you copied the entire result from the AI.");
    }
  };



  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (templates.length <= 1) {
      alert("Cannot delete the last template.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the template "${name}"?`)) {
      deleteTemplate(id);
    }
  };

  const handleExport = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${template.name.replace(/\s+/g, '_').toLowerCase()}_template.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    duplicateTemplate(id);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const template = JSON.parse(event.target?.result as string);
          if (template.name && template.layouts && template.designConfig) {
            importTemplate(template);
          } else {
            alert("Invalid template file.");
          }
        } catch (err) {
          alert("Failed to parse template file.");
        }
        // Clear value to allow re-importing the same file
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const handleEdit = (id: string) => {
    setActiveTemplate(id);
    navigate(`/templates/${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] overflow-auto text-gray-200">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />
      <PageHeader 
        title="Design Libraries"
        icon={<LayoutTemplate size={16} className="text-[#D62828]" />}
        actions={
          <>
            <Button onClick={() => {
              if (window.confirm("This will reset all templates to default. Continue?")) {
                localStorage.removeItem('presentation-store');
                window.location.reload();
              }
            }} variant="outline" className="text-gray-400 hover:text-white border-[#333] hover:bg-[#252526]">
              Reset Data
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2 border-none">
               <Plus size={18} /> Create
            </Button>
          </>
        }
      />

      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {templates.map(template => (
            <PreviewCard 
              key={template.id}
              title={template.name}
              badge={
                <span className="text-[10px] bg-[#2d2d30] text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {template.layouts.length} Layouts
                </span>
              }
              footer={
                <>
                  <LayoutTemplate size={12} className="text-gray-600" />
                  <span>Custom Template Engine</span>
                </>
              }
              onClick={() => handleEdit(template.id)}
              preview={
                <div 
                  className="absolute inset-0 p-4 flex flex-col gap-3"
                  style={{ backgroundColor: template.designConfig.bg, textAlign: template.designConfig.contentAlignment }}
                >
                  <div className="flex-1 flex flex-col justify-center px-4">
                     <h4 
                        className="leading-tight mb-2 opacity-90 truncate" 
                        style={{ 
                           color: template.designConfig.textPrimary, 
                           fontFamily: template.designConfig.headingFont,
                           fontWeight: template.designConfig.headingWeight,
                           fontSize: '1.25rem',
                           letterSpacing: template.designConfig.letterSpacing
                        }}
                     >{template.name}</h4>
                     <div className="flex gap-2" style={{ justifyContent: template.designConfig.contentAlignment === 'center' ? 'center' : 'flex-start' }}>
                        <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: template.designConfig.primary }}></div>
                        <div className="w-4 h-4 rounded shadow-sm opacity-60" style={{ backgroundColor: template.designConfig.secondary }}></div>
                        <div className="w-4 h-4 rounded shadow-sm opacity-30" style={{ backgroundColor: template.designConfig.accent }}></div>
                     </div>
                  </div>
                  
                  <div className="bg-[#161618]/20 backdrop-blur-md rounded-lg p-3 border border-white/5 flex items-center justify-between">
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                     </div>
                     <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{template.designConfig.headingFont} System</span>
                  </div>
                </div>
              }
              topRightActions={
                <>
                  <button 
                    onClick={(e) => handleExport(e, template)}
                    className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-[#2d2d30] text-white rounded-lg transition-colors backdrop-blur-sm"
                    title="Export template"
                  >
                    <Download size={14}/>
                  </button>
                  <button 
                    onClick={(e) => handleDuplicate(e, template.id)}
                    className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-[#2d2d30] text-white rounded-lg transition-colors backdrop-blur-sm"
                    title="Duplicate template"
                  >
                    <Copy size={14}/>
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, template.id, template.name)}
                    className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-[#b20112] text-white rounded-lg transition-colors backdrop-blur-sm shadow-xl"
                    title="Delete template"
                  >
                    <Trash2 size={14}/>
                  </button>
                </>
              }
              actions={
                <Button className="bg-[#D62828] hover:bg-[#b20112] text-white border-none shadow-xl gap-2 font-bold px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <Edit2 size={16} /> Edit Layouts
                </Button>
              }
            />
          ))}

          {/* Create New Card */}
          <div 
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-[#2d2d30] rounded-xl flex flex-col items-center justify-center p-8 text-gray-500 hover:text-white hover:border-[#D62828] hover:bg-[#D62828]/10 transition-all cursor-pointer min-h-[260px] bg-[#161618]"
          >
             <div className="w-16 h-16 rounded-full bg-[#2d2d30] flex items-center justify-center mb-5 group-hover:bg-[#D62828] shadow-sm transition-colors">
               <Plus size={32} className="text-gray-400 group-hover:text-white" />
             </div>
             <p className="font-bold font-display text-xl text-white">Create New Template</p>
             <p className="text-sm text-center mt-3 text-gray-400 font-medium">Start from a blank canvas with our default layouts.</p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0f0f10] z-50 flex flex-col animate-in fade-in duration-500">
          {/* Immersive Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D62828] rounded-lg flex items-center justify-center shadow-lg shadow-[#D62828]/20">
                    <Palette size={16} className="text-white"/>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {createStep === 1 ? 'Template Identity' : 'Brand Systems Design'}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5 ml-0.5">
                  <div className="flex gap-0.5">
                    <div className={cn("h-0.5 w-6 rounded-full transition-all", createStep >= 1 ? "bg-[#D62828]" : "bg-white/10")}></div>
                    <div className={cn("h-0.5 w-6 rounded-full transition-all", createStep >= 2 ? "bg-[#D62828]" : "bg-white/10")}></div>
                  </div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-2">Phase {createStep} of 2</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setShowCreateModal(false); setCreateStep(1); }}
              className="group flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-lg"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Exit Wizard</span>
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#0f0f10] selection:bg-[#D62828] selection:text-white">
            <div className="max-w-6xl mx-auto px-8 py-12">
              {createStep === 1 ? (
                <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700 ease-out">
                  <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                      Every great deck starts with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D62828] to-[#fe6247]">Strong Name.</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-medium opacity-80">Define your template's identity before we engineer the layouts.</p>
                  </div>
                  
                  <div className="relative group">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-white/10 text-white py-6 text-3xl md:text-4xl font-black outline-none focus:border-[#D62828] transition-all placeholder:text-white/5"
                      placeholder="Enter template name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTemplateName.trim()) {
                          setCreateStep(2);
                        }
                      }}
                    />
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                       <ChevronRight size={32} className="text-[#D62828]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
                     {['Pitch Deck', 'Technical Architecture', 'Marketing QBR', 'Product Roadmap', 'Creative Portfolio'].map(suggestion => (
                       <button
                         key={suggestion}
                         onClick={() => setNewTemplateName(suggestion)}
                         className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-[#D62828] hover:bg-[#D62828]/5 transition-all group"
                       >
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#D62828]">Suggestion</p>
                         <p className="text-white font-bold">{suggestion}</p>
                       </button>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-12 duration-700 ease-out">
                  {/* Step Header */}
                  <div className="space-y-1 mb-8">
                    <h2 className="text-2xl font-black text-white tracking-tight">Design System Engineering</h2>
                    <p className="text-gray-400 font-medium text-sm">Define the visual DNA that will power every layout in this template.</p>
                  </div>

                  <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                    <button 
                      onClick={() => setDesignEntryMode('auto')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2",
                        designEntryMode === 'auto' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/10" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Sparkles size={14} /> AI Engine
                    </button>
                    <button 
                      onClick={() => setDesignEntryMode('manual')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2",
                        designEntryMode === 'manual' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/10" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <Palette size={14} /> Manual Control
                    </button>
                  </div>

                  {designEntryMode === 'auto' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start py-6">
                      <div className="space-y-8">
                        <div>
                           <div className="space-y-1 mb-6">
                              <h4 className="text-xl font-black text-white tracking-tight">AI Identity Engineering</h4>
                              <p className="text-gray-400 text-xs opacity-70">Synthesize icons, fonts, and colors into a production design system.</p>
                           </div>

                           <div className="z-10 w-full">
                              <AIAssistantPanel 
                                promptValue={aiDesignPrompt}
                                onPromptChange={setAiDesignPrompt}
                                onGenerate={handleAiDesignGenerate}
                                isGenerating={isGeneratingDesign}
                                placeholder="Describe your brand's mood, color palette, or vibe..."
                                defaultMode={aiMode}
                                onModeChange={(mode) => setAiMode(mode as 'ai' | 'prompt')}
                                systemPromptBuilder={buildDesignConfigPrompt}
                              />
                              {aiMode === 'prompt' && (
                                <div className="relative mt-2 bg-[#1e1e1e] border border-[#2d2d30] rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Apply AI Result</span>
                                     <span className="text-[9px] text-[#D62828] font-mono">Expects: &lt;json&gt; content</span>
                                  </div>
                                  <Textarea 
                                    value={aiResponseText}
                                    onChange={e => setAiResponseText(e.target.value)}
                                    placeholder="Paste the full AI response here..."
                                    className="w-full bg-[#252526] border border-[#333] text-gray-200 text-[11px] focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-mono resize-none rounded-lg p-3 min-h-[80px]"
                                  />
                                  <button 
                                    onClick={handleApplyAiResponse}
                                    disabled={!aiResponseText.trim()}
                                    className="absolute right-6 bottom-6 bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 shadow-lg"
                                  >
                                    <Download size={14} /> Apply
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inspiration Presets</p>
                           <div className="flex flex-wrap gap-2">
                              {['Cyberpunk Neon', 'Swiss Brutalist', 'Organic Minimalist', 'High-End Luxury', 'Playful Startup', 'Deep Sea Dark Mode'].map(tag => (
                                <button 
                                  key={tag}
                                  onClick={() => setAiDesignPrompt(tag)}
                                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-[#D62828] hover:bg-[#D62828]/10 transition-all"
                                >
                                  {tag}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>

                      {/* Live Visual Preview */}
                      <div className="sticky top-24">
                         <RealtimePreview config={designConfig} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 py-8">
                       {/* Manual Controls */}
                       <div className="space-y-12">
                          <ThemeSettingsPanel 
                            config={designConfig}
                            onChange={(updates) => setDesignConfig(prev => ({ ...prev, ...updates }))}
                            layout="grid"
                          />
                       </div>

                       {/* Preview persistence */}
                       <div className="sticky top-24">
                         <RealtimePreview config={designConfig} />
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0f0f10] border-t border-white/5 px-8 py-6 flex items-center justify-between z-20">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                if (createStep === 1) setShowCreateModal(false);
                else setCreateStep(1);
              }}
              className="border-white/10 text-gray-400 hover:text-white bg-transparent hover:bg-white/5 h-12 px-6 rounded-xl font-bold transition-all text-sm"
            >
              {createStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col text-right">
                 <span className="text-white font-bold text-sm">{newTemplateName || "Untitled Template"}</span>
                 <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Lumina Systems v1.2</span>
              </div>

              {createStep === 1 ? (
                <Button 
                  type="button"
                  disabled={!newTemplateName.trim()}
                  onClick={() => setCreateStep(2)}
                  className="bg-white text-black hover:bg-gray-200 border-none h-12 px-8 rounded-xl font-black flex items-center gap-2 text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Continue <ChevronRight size={18} />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleCreateSubmit}
                  className="bg-[#D62828] hover:bg-[#b20112] text-white border-none h-12 px-8 rounded-xl font-black flex items-center gap-2 text-sm shadow-xl shadow-[#D62828]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Confirm & Launch <Sparkles size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
