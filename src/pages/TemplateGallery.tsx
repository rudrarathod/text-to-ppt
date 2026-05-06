import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { Button, Textarea } from "../components/ui";
import { Plus, LayoutTemplate, Trash2, Edit2, X, Download, Upload, Copy, Palette, ChevronRight, ChevronLeft, Sparkles, Wand2, Loader2, Check, Settings2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { askAiForDesignConfig, buildDesignConfigPrompt } from "../lib/gemini";
import { GoogleFontLoader, POPULAR_FONTS } from "../lib/typography";
import { ThemeSettingsPanel } from "../components/design-system/ThemeSettingsPanel";
import { AIAssistantPanel } from "../components/ai/AIAssistantPanel";
import { PreviewCard } from "../components/layout/PreviewCard";
import { GalleryLayout } from "../components/layout/GalleryLayout";
import { FullScreenModal } from "../components/layout/FullScreenModal";
import { SlidePreview } from "../components/SlidePreview";



// Sample slide layouts that will be previewed
const PREVIEW_LAYOUTS = [
  {
    name: "Title Slide",
    code: `<div class="flex flex-col items-center justify-center h-full w-full bg-lumina-bg p-20 text-center">
  <h1 class="text-7xl font-black font-display text-lumina-primary mb-6 leading-[0.9]">Your Template Name</h1>
  <div class="w-24 h-2 bg-lumina-secondary mb-8 rounded-full"></div>
  <h2 class="text-3xl font-medium text-lumina-text-secondary">A powerful design system for your presentations</h2>
</div>`,
    data: { title: "Your Template Name", subtitle: "A powerful design system" }
  },
  {
    name: "Content Slide",
    code: `<div class="flex flex-col h-full w-full bg-lumina-surface p-20">
  <h2 class="text-5xl font-bold font-display text-lumina-text-primary mb-12 flex items-center gap-4">
    <span class="w-3 h-12 bg-lumina-primary rounded-full"></span>
    Key Highlights
  </h2>
  <ul class="list-none text-3xl text-lumina-text-secondary space-y-8">
    <li class="flex items-start gap-4"><span class="w-3 h-3 rounded-full bg-lumina-secondary mt-3 shrink-0"></span>Beautiful typography that adapts to your brand</li>
    <li class="flex items-start gap-4"><span class="w-3 h-3 rounded-full bg-lumina-secondary mt-3 shrink-0"></span>Consistent color palette across all slides</li>
    <li class="flex items-start gap-4"><span class="w-3 h-3 rounded-full bg-lumina-secondary mt-3 shrink-0"></span>Professional layouts for every type of content</li>
  </ul>
</div>`,
    data: { title: "Key Highlights" }
  },
  {
    name: "Divider Slide",
    code: `<div class="flex items-center justify-center h-full w-full bg-lumina-primary text-white p-16">
  <div class="text-center">
    <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
    </div>
    <div class="border-t-4 border-white/30 pt-8">
      <h2 class="text-6xl font-black font-display uppercase tracking-wider">Section Break</h2>
      <p class="text-2xl mt-4 opacity-70">Transition between major topics</p>
    </div>
  </div>
</div>`,
    data: { section: "Section Break" }
  }
];

const RealtimePreview = ({ config, templateName }: { config: any; templateName?: string }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = PREVIEW_LAYOUTS.length;

  // Swap the template name in the preview data
  const getSlideData = (index: number) => ({
    ...PREVIEW_LAYOUTS[index].data,
    title: index === 0 && templateName ? templateName : PREVIEW_LAYOUTS[index].data.title
  });

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#D62828] animate-ping absolute inset-0 opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-[#D62828] relative"></div>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Live Render</h4>
            <p className="text-[8px] text-gray-500 font-medium mt-0.5">{PREVIEW_LAYOUTS[activeSlide].name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
          >
            <ChevronLeft size={12} className="text-gray-400" />
          </button>
          <div className="flex gap-1">
            {PREVIEW_LAYOUTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === activeSlide ? "w-6 bg-[#D62828]" : "w-2 bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % totalSlides)}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all"
          >
            <ChevronRight size={12} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Slide Preview */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)]" style={{ aspectRatio: '16/9' }}>
        <SlidePreview
          key={`${activeSlide}-${JSON.stringify(config)}`}
          templateCode={PREVIEW_LAYOUTS[activeSlide].code}
          data={getSlideData(activeSlide)}
          designConfig={config}
          interactive={false}
        />
      </div>

      {/* Slide Strip (thumbnails) */}
      <div className="flex gap-2 mt-2">
        {PREVIEW_LAYOUTS.map((layout, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={cn(
              "relative overflow-hidden rounded-lg border transition-all flex-1",
              i === activeSlide
                ? "border-[#D62828] shadow-lg shadow-[#D62828]/20 ring-1 ring-[#D62828]"
                : "border-white/10 hover:border-white/30"
            )}
            style={{ aspectRatio: '16/9' }}
          >
            <SlidePreview
              key={`thumb-${i}-${JSON.stringify(config)}`}
              templateCode={layout.code}
              data={getSlideData(i)}
              designConfig={config}
              interactive={false}
            />
            <div className={cn(
              "absolute inset-0 transition-all",
              i === activeSlide ? "bg-transparent" : "bg-black/20"
            )}></div>
          </button>
        ))}
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
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".json" 
        className="hidden" 
      />
      <GalleryLayout
      title="Design Library"
      icon={<LayoutTemplate size={16} className="text-[#D62828]" />}
    >
      {templates.map(template => (
        <PreviewCard 
          key={template.id}
          title={template.name}
          badge={
            <span className="text-[10px] text-gray-500 font-medium">
              {template.layouts.length} layouts
            </span>
          }
          footer={
            <>
              <LayoutTemplate size={12} className="text-gray-600" />
              <span>Custom Engine</span>
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
          menuItems={[
            {
              label: 'Edit Layouts',
              icon: <Edit2 size={14} />,
              onClick: (e) => {
                e.stopPropagation();
                handleEdit(template.id);
              }
            },
            {
              label: 'Duplicate',
              icon: <Copy size={14} />,
              onClick: (e) => handleDuplicate(e, template.id)
            },
            {
              label: 'Export',
              icon: <Download size={14} />,
              onClick: (e) => handleExport(e, template)
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              danger: true,
              onClick: (e) => handleDelete(e, template.id, template.name)
            }
          ]}
        />
      ))}

      {/* Create New Card */}
      <PreviewCard 
        isCreateCard
        title="Create New Template"
        onClick={() => setShowCreateModal(true)}
        preview={
          <div className="w-16 h-16 rounded-full bg-[#2d2d30] flex items-center justify-center group-hover:bg-[#D62828] group-hover:scale-110 transition-all duration-300 shadow-xl">
            <Plus size={32} className="text-gray-400 group-hover:text-white" />
          </div>
        }
      />
    </GalleryLayout>

      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0f0f10] z-50 flex flex-col animate-in fade-in duration-500">
          {/* Immersive Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#D62828] rounded-xl flex items-center justify-center shadow-lg shadow-[#D62828]/20">
                <Palette size={20} className="text-white"/>
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1">
                  {createStep === 1 ? 'Template Identity' : 'Design Engineering'}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className={cn("h-1 w-8 rounded-full transition-all duration-500", createStep >= 1 ? "bg-[#D62828]" : "bg-white/10")}></div>
                    <div className={cn("h-1 w-8 rounded-full transition-all duration-500", createStep >= 2 ? "bg-[#D62828]" : "bg-white/10")}></div>
                  </div>
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Step 0{createStep}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setShowCreateModal(false); setCreateStep(1); }}
              className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Close Wizard</span>
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#0f0f10] selection:bg-[#D62828] selection:text-white">
            <div className="max-w-6xl mx-auto px-8 py-12">
              {createStep === 1 ? (
                <div className="max-w-4xl mx-auto space-y-16 py-10 animate-in slide-in-from-bottom-12 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D62828]/10 rounded-full border border-[#D62828]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse"></div>
                      <span className="text-[10px] font-black text-[#D62828] uppercase tracking-[0.2em]">Phase 01: Identity</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
                      Define the <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#D62828] via-[#fe6247] to-[#D62828] bg-[length:200%_200%] animate-gradient-flow">Foundations.</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-medium max-w-2xl leading-relaxed">Give your template a name that reflects its purpose. This will be the anchor for your entire design system.</p>
                  </div>
                  
                  <div className="relative group max-w-3xl">
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1 h-0 group-focus-within:h-12 bg-[#D62828] transition-all duration-500 rounded-full"></div>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full bg-transparent border-b-4 border-white/5 text-white py-8 text-4xl md:text-6xl font-black outline-none focus:border-[#D62828] transition-all placeholder:text-white/5 tracking-tighter"
                      placeholder="Template name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTemplateName.trim()) {
                          setCreateStep(2);
                        }
                      }}
                    />
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-all duration-500 translate-x-4 group-focus-within:translate-x-0">
                       <div className="flex items-center gap-2 text-[#D62828]">
                         <span className="text-[10px] font-black uppercase tracking-widest">Press Enter</span>
                         <ChevronRight size={32} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/5"></div>
                      <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Industry Presets</span>
                      <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                       {[
                         { name: 'Pitch Deck', icon: '🚀' },
                         { name: 'Technical Spec', icon: '🛠️' },
                         { name: 'Executive QBR', icon: '📊' },
                         { name: 'Brand Guide', icon: '✨' }
                       ].map(suggestion => (
                         <button
                           key={suggestion.name}
                           onClick={() => setNewTemplateName(suggestion.name)}
                           className="px-6 py-6 bg-[#161618] border border-white/5 rounded-[24px] text-left hover:border-[#D62828]/50 hover:bg-[#D62828]/5 transition-all duration-300 group relative overflow-hidden"
                         >
                           <div className="absolute -right-2 -bottom-2 text-4xl opacity-5 group-hover:opacity-20 group-hover:-rotate-12 transition-all duration-500 grayscale group-hover:grayscale-0">
                             {suggestion.icon}
                           </div>
                           <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#D62828]">Style</p>
                           <p className="text-white font-bold tracking-tight">{suggestion.name}</p>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in slide-in-from-right-12 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  {/* Step Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D62828]/10 rounded-full border border-[#D62828]/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D62828] animate-pulse"></div>
                        <span className="text-[10px] font-black text-[#D62828] uppercase tracking-[0.2em]">Phase 02: Engineering</span>
                      </div>
                      <h2 className="text-4xl font-black text-white tracking-tight">Design System Forge</h2>
                      <p className="text-gray-400 font-medium text-lg max-w-xl">Configure the visual DNA. Use AI to synthesize a theme or take manual control of every variable.</p>
                    </div>

                    <div className="flex p-1 bg-[#161618] rounded-2xl border border-white/5 w-fit h-fit self-start md:self-end">
                      <button 
                        onClick={() => setDesignEntryMode('auto')}
                        className={cn(
                          "px-8 py-3 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 uppercase tracking-widest",
                          designEntryMode === 'auto' ? "bg-[#D62828] text-white shadow-xl shadow-[#D62828]/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                      >
                        <Sparkles size={14} /> AI Synthesis
                      </button>
                      <button 
                        onClick={() => setDesignEntryMode('manual')}
                        className={cn(
                          "px-8 py-3 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 uppercase tracking-widest",
                          designEntryMode === 'manual' ? "bg-[#D62828] text-white shadow-xl shadow-[#D62828]/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                      >
                        <Palette size={14} /> Manual Forge
                      </button>
                    </div>
                  </div>

                  {designEntryMode === 'auto' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                      <div className="space-y-12">
                        <div className="space-y-8">
                           <div className="p-8 bg-[#161618] border border-white/5 rounded-[32px] relative overflow-hidden group">
                              {/* Background Glow */}
                              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D62828]/5 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                              
                              <div className="relative z-10 space-y-8">
                                <div className="space-y-1">
                                   <h4 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                     <Wand2 size={20} className="text-[#D62828]" />
                                     AI Prompt Engineering
                                   </h4>
                                   <p className="text-gray-500 text-sm font-medium">Describe your brand vibe and let our engine generate a full design system.</p>
                                </div>

                                <div className="space-y-4">
                                  <AIAssistantPanel 
                                    promptValue={aiDesignPrompt}
                                    onPromptChange={setAiDesignPrompt}
                                    onGenerate={handleAiDesignGenerate}
                                    isGenerating={isGeneratingDesign}
                                    placeholder="e.g. A sleek cyberpunk theme with neon accents and high-contrast typography..."
                                    defaultMode={aiMode}
                                    onModeChange={(mode) => setAiMode(mode as 'ai' | 'prompt')}
                                    systemPromptBuilder={buildDesignConfigPrompt}
                                  />
                                  
                                  {aiMode === 'prompt' && (
                                    <div className="relative mt-4 bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                                      <div className="flex items-center justify-between mb-4">
                                         <div className="flex items-center gap-2">
                                           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Raw System Response</span>
                                         </div>
                                      </div>
                                      <Textarea 
                                        value={aiResponseText}
                                        onChange={e => setAiResponseText(e.target.value)}
                                        placeholder="Paste the full AI JSON response here..."
                                        className="w-full bg-[#0f0f10] border border-white/5 text-gray-300 text-xs focus-visible:ring-1 focus-visible:ring-[#D62828]/50 font-mono resize-none rounded-xl p-4 min-h-[120px]"
                                      />
                                      <div className="flex justify-end mt-4">
                                        <button 
                                          onClick={handleApplyAiResponse}
                                          disabled={!aiResponseText.trim()}
                                          className="bg-[#D62828] hover:bg-[#b20112] text-white disabled:opacity-50 transition-all px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                                        >
                                          <Check size={14} /> Inject System Data
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4 px-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Inspiration Presets</span>
                                <div className="h-px flex-1 bg-white/5"></div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {[
                                   { label: 'Cyberpunk Neon', icon: '🌃' },
                                   { label: 'Swiss Brutalist', icon: '📐' },
                                   { label: 'Organic Minimalist', icon: '🌿' },
                                   { label: 'Deep Sea Dark', icon: '🌊' }
                                 ].map(tag => (
                                   <button 
                                     key={tag.label}
                                     onClick={() => setAiDesignPrompt(tag.label)}
                                     className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:border-[#D62828] hover:bg-[#D62828]/10 transition-all flex items-center gap-2 group"
                                   >
                                     <span className="opacity-50 group-hover:opacity-100 transition-opacity">{tag.icon}</span>
                                     {tag.label}
                                   </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Live Visual Preview */}
                      <div className="sticky top-12">
                         <div className="relative">
                            <div className="absolute -inset-4 bg-[#D62828]/5 blur-3xl rounded-full opacity-20"></div>
                            <RealtimePreview config={designConfig} templateName={newTemplateName} />
                         </div>
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
                          <RealtimePreview config={designConfig} templateName={newTemplateName} />
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0f0f10] border-t border-white/5 px-8 py-6 flex items-center justify-between z-20 shadow-[0_-16px_32px_rgba(0,0,0,0.5)]">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                if (createStep === 1) setShowCreateModal(false);
                else setCreateStep(1);
              }}
              className="border-white/5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 h-12 px-8 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
              {createStep === 1 ? <X size={14} /> : <ChevronRight size={14} className="rotate-180" />}
              {createStep === 1 ? 'Discard Wizard' : 'Previous Phase'}
            </Button>
            
            <div className="flex items-center gap-8">
              <div className="hidden md:flex flex-col text-right">
                 <span className="text-white font-black text-sm tracking-tight">{newTemplateName || "Untitled System"}</span>
                 <div className="flex items-center justify-end gap-1.5">
                   <div className="w-1 h-1 rounded-full bg-green-500"></div>
                   <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Lumina Architecture v2.0</span>
                 </div>
              </div>

              {createStep === 1 ? (
                <Button 
                  type="button"
                  disabled={!newTemplateName.trim()}
                  onClick={() => setCreateStep(2)}
                  className="bg-white text-black hover:bg-gray-100 border-none h-12 px-10 rounded-xl font-black flex items-center gap-2 text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  Next Phase <ChevronRight size={16} />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleCreateSubmit}
                  className="bg-[#D62828] hover:bg-[#b20112] text-white border-none h-12 px-10 rounded-xl font-black flex items-center gap-2 text-xs uppercase tracking-widest shadow-2xl shadow-[#D62828]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Deploy System <Sparkles size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
