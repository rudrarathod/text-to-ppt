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
import { PreviewCard } from "../components/layout/PreviewCard";
import { GalleryLayout } from "../components/layout/GalleryLayout";
import { FullScreenModal } from "../components/layout/FullScreenModal";
import { ThemeShowcase } from "../components/design-system/ThemeShowcase";





export function TemplateGallery() {
  const { templates, createTemplate, deleteTemplate, setActiveTemplate, importTemplate, duplicateTemplate } = useAppStore();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
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
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0f0f10]/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#D62828] rounded-lg flex items-center justify-center shadow-lg shadow-[#D62828]/20">
                <Palette size={16} className="text-white"/>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Create Template</h3>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(false)}
              className="p-2 text-gray-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Settings */}
            <div className="w-[450px] border-right border-white/5 bg-[#121214] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Template Name Section */}
                <div className="space-y-4">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Template Identity</p>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 text-white py-2 text-2xl font-black outline-none focus:border-[#D62828] transition-all placeholder:text-white/5"
                    placeholder="Enter name..."
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Pitch Deck', 'Technical', 'Product', 'Creative'].map(s => (
                      <button key={s} onClick={() => setNewTemplateName(s)} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 hover:text-white hover:border-[#D62828] transition-all">{s}</button>
                    ))}
                  </div>
                </div>

                {/* Design Mode Selection */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Visual DNA Engine</p>
                    <div className="flex p-0.5 bg-white/5 rounded-lg border border-white/5">
                      <button 
                        onClick={() => setDesignEntryMode('auto')}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                          designEntryMode === 'auto' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/10" : "text-gray-500 hover:text-gray-300"
                        )}
                      >
                        <Sparkles size={12} /> AI
                      </button>
                      <button 
                        onClick={() => setDesignEntryMode('manual')}
                        className={cn(
                          "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                          designEntryMode === 'manual' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/10" : "text-gray-500 hover:text-gray-300"
                        )}
                      >
                        <Settings2 size={12} /> Manual
                      </button>
                    </div>
                  </div>

                  {designEntryMode === 'auto' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                      <AIAssistantPanel 
                        promptValue={aiDesignPrompt}
                        onPromptChange={setAiDesignPrompt}
                        onGenerate={handleAiDesignGenerate}
                        isGenerating={isGeneratingDesign}
                        placeholder="Describe your brand's mood..."
                        defaultMode={aiMode}
                        onModeChange={(mode) => setAiMode(mode as 'ai' | 'prompt')}
                        systemPromptBuilder={buildDesignConfigPrompt}
                      />
                      
                      <div className="space-y-3">
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Design Presets</p>
                        <div className="flex flex-wrap gap-2">
                          {['Neon Noir', 'Brutalist', 'Luxury', 'Startup'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => { setAiDesignPrompt(tag); handleAiDesignGenerate(); }}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white transition-all"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                      <ThemeSettingsPanel 
                        config={designConfig}
                        onChange={(updates) => setDesignConfig(prev => ({ ...prev, ...updates }))}
                        layout="grid"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-white/5 bg-[#0f0f10]">
                <Button 
                  onClick={handleCreateSubmit}
                  disabled={!newTemplateName.trim()}
                  className="w-full bg-[#D62828] hover:bg-[#b20112] text-white border-none h-12 rounded-xl font-black flex items-center justify-center gap-2 text-sm shadow-xl shadow-[#D62828]/20 transition-all active:scale-[0.98]"
                >
                  Create Template <ChevronRight size={18} />
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-[#0f0f10] relative flex items-center justify-center p-12 overflow-y-auto">
               <div className="w-full max-w-6xl animate-in zoom-in-95 duration-500">
                 <ThemeShowcase config={designConfig} />
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
