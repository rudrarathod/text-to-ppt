import { useState, useRef, ChangeEvent } from "react";
import { useAppStore, DesignConfig, Presentation } from "../store";
import { Button } from "../components/ui";
import { Plus, Presentation as PresentationIcon, Trash2, Edit2, Layout as LayoutIcon, ChevronRight, ChevronLeft, X, Search, ArrowUpDown, Play, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";

import { SlidePreview } from "../components/SlidePreview";
import { PageHeader } from "../components/layout/PageHeader";
import { PreviewCard } from "../components/layout/PreviewCard";
import { GalleryLayout } from "../components/layout/GalleryLayout";
import { FullScreenModal } from "../components/layout/FullScreenModal";

export function PresentationGallery() {
  const { presentations, activePresentationId, createPresentation, deletePresentation, setActivePresentation, templates, createTemplate, updateActiveTemplateDesign, setSlides, importPresentation } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [currentLayoutIndex, setCurrentLayoutIndex] = useState(0);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateSort, setTemplateSort] = useState<'name' | 'newest' | 'layouts'>('newest');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const templateIdToUse = selectedTemplateId || templates[0]?.id || "t-default";
    const newId = createPresentation(newTitle, templateIdToUse);
    setActivePresentation(newId);
    setShowCreateModal(false);
    setNewTitle("");
    navigate(`/builder/${newId}`);
  };



  const filteredTemplates = templates
    .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
    .sort((a, b) => {
      if (templateSort === 'name') return a.name.localeCompare(b.name);
      if (templateSort === 'layouts') return b.layouts.length - a.layouts.length;
      if (templateSort === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const presentation = JSON.parse(event.target?.result as string);
          if (presentation.name && Array.isArray(presentation.slides)) {
            importPresentation(presentation);
          } else {
            alert("Invalid presentation file.");
          }
        } catch (err) {
          alert("Failed to parse presentation file.");
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    }
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
      title="Presentations"
      icon={<PresentationIcon size={18} className="text-gray-400" />}
      headerActions={
        <div className="flex items-center gap-2 md:gap-3">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 md:px-4 h-9 md:h-10 text-xs transition-all flex items-center"
          >
            <Upload size={16} className="md:mr-2" />
            <span className="hidden md:inline">Import</span>
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold px-4 md:px-6 h-9 md:h-10 text-xs md:text-sm transition-all"
          >
            <Plus size={16} className="md:mr-2" />
            <span className="hidden md:inline">New Presentation</span>
          </Button>
        </div>
      }
    >
      {presentations.map(presentation => {
        const currentTemplate = templates.find(t => t.id === presentation.templateId);
        return (
          <PreviewCard
            key={presentation.id}
            title={presentation.name}
            subtitle={formatDistanceToNow(presentation.updatedAt, { addSuffix: true })}
            badge={
              <span className="text-[10px] text-gray-500 font-medium">
                {presentation.slides.length} slides
              </span>
            }
            onClick={() => {
              setActivePresentation(presentation.id);
              navigate(`/builder/${presentation.id}`);
            }}
            preview={
              <div
                className="w-full h-full relative flex items-center justify-center"
                style={{ backgroundColor: currentTemplate?.designConfig.bg || '#1a1a1a' }}
              >
                <h3
                  className="text-center font-bold px-6 line-clamp-3 text-xl drop-shadow-sm pointer-events-none"
                  style={{ color: currentTemplate?.designConfig.primary || '#ffffff' }}
                >
                  {presentation.slides[0]?.content.title || presentation.name}
                </h3>
              </div>
            }
            menuItems={[
              {
                label: 'Open Builder',
                icon: <Edit2 size={14} />,
                onClick: (e) => {
                  e.stopPropagation();
                  setActivePresentation(presentation.id);
                  navigate(`/builder/${presentation.id}`);
                }
              },
              {
                label: 'Present',
                icon: <Play size={14} />,
                onClick: (e) => {
                  e.stopPropagation();
                  setActivePresentation(presentation.id);
                  navigate(`/builder/${presentation.id}/present`);
                }
              },
              {
                label: 'Delete',
                icon: <Trash2 size={14} />,
                danger: true,
                onClick: (e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${presentation.name}"?`)) {
                    deletePresentation(presentation.id);
                  }
                }
              }
            ]}
          />
        );
      })}

      {/* Create New Card */}
      <PreviewCard 
        isCreateCard
        title="Manual Presentation"
        onClick={() => {
          setShowCreateModal(true);
          if (templates.length > 0) {
            setSelectedTemplateId(templates[0].id);
            setCurrentLayoutIndex(0);
          }
        }}
        preview={
          <div className="w-16 h-16 rounded-full bg-[#2d2d30] flex items-center justify-center group-hover:bg-[#D62828] group-hover:scale-110 transition-all duration-300 shadow-xl">
            <Plus size={32} className="text-gray-400 group-hover:text-white" />
          </div>
        }
      />
    </GalleryLayout>
    {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-300">
          <div className="bg-[#1e1e1e] border-t md:border border-[#2d2d30] rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#2d2d30] bg-[#161618] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#D62828]/10 flex items-center justify-center">
                  <PresentationIcon className="text-[#D62828]" size={20}/>
                </div>
                <div>
                  <h3 className="text-base md:text-xl font-bold text-white leading-none">New Presentation</h3>
                  <p className="hidden md:block text-xs text-gray-500 mt-1">Select a design style to get started</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
              {/* Left Sidebar: Title & Template List */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#2d2d30] flex flex-col bg-[#161618]/50 shrink-0">
                <div className="p-4 md:p-6 shrink-0">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Presentation Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] text-white rounded-xl px-4 py-3 outline-none focus:border-[#D62828] transition-all shadow-inner text-sm"
                    placeholder="E.g., Q3 Marketing Plan..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 pb-6">
                  <div className="space-y-4 mb-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Design Library</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input 
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search designs..."
                        className="w-full bg-[#1e1e1e] border border-[#2d2d30] rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#D62828] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 md:overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {filteredTemplates.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setCurrentLayoutIndex(0);
                        }}
                        className={cn(
                          "group cursor-pointer p-3 rounded-xl transition-all border flex items-center justify-between",
                          selectedTemplateId === t.id 
                            ? "bg-[#D62828]/10 border-[#D62828] shadow-lg shadow-[#D62828]/5" 
                            : "bg-transparent border-transparent hover:bg-[#2d2d30]/50 hover:border-[#333]"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: t.designConfig.primary }}
                          >
                            {t.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                             <h4 className="font-bold text-sm text-white truncate">{t.name}</h4>
                             <p className="text-[10px] text-gray-500 truncate">{t.layouts.length} layouts</p>
                          </div>
                        </div>
                        {selectedTemplateId === t.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D62828]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Large Preview Area */}
              <div className="flex-1 bg-[#111111] p-4 md:p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-0">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D62828]/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>

                {selectedTemplateId && templates.find(t => t.id === selectedTemplateId) ? (() => {
                  const t = templates.find(temp => temp.id === selectedTemplateId)!;
                  const currentLayout = t.layouts[currentLayoutIndex] || t.layouts[0];
                  const mockData = currentLayout?.mockData || { title: t.name, subtitle: "Full Design System Preview" };
                  
                  return (
                    <div className="w-full flex flex-col items-center gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-full max-w-2xl relative group/preview">
                        <div className="absolute -inset-4 bg-gradient-to-br from-[#D62828]/20 to-transparent blur-2xl opacity-50"></div>
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#333] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                          <SlidePreview 
                            templateCode={currentLayout?.code || ""}
                            data={mockData}
                            designConfig={t.designConfig}
                            className="w-full h-full"
                          />

                          {/* Layout Navigation */}
                          {t.layouts.length > 1 && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayoutIndex((prev) => (prev - 1 + t.layouts.length) % t.layouts.length);
                                }}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all hover:bg-[#D62828]"
                              >
                                <ChevronLeft size={20} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayoutIndex((prev) => (prev + 1) % t.layouts.length);
                                }}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all hover:bg-[#D62828]"
                              >
                                <ChevronRight size={20} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Layout Name Badge */}
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-[#D62828] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                           {currentLayout?.name || "Layout Preview"}
                        </div>
                      </div>

                      {/* Design Details (Hidden on very small height mobile screens if needed, but let's keep for now) */}
                      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-[#2d2d30] flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Palette</p>
                           <div className="flex gap-1.5">
                              <div className="w-5 h-5 rounded shadow-inner" style={{ backgroundColor: t.designConfig.primary }} title="Primary"></div>
                              <div className="w-5 h-5 rounded shadow-inner" style={{ backgroundColor: t.designConfig.secondary }} title="Secondary"></div>
                              <div className="w-5 h-5 rounded shadow-inner" style={{ backgroundColor: t.designConfig.bg }} title="Background"></div>
                           </div>
                        </div>
                        <div className="bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-[#2d2d30] flex md:flex-col items-center md:items-start justify-between md:justify-start gap-1">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Type</p>
                           <p className="text-[11px] font-bold text-white truncate">{t.designConfig.headingFont}</p>
                        </div>
                        <div className="bg-[#1e1e1e] p-3 md:p-4 rounded-2xl border border-[#2d2d30] flex md:flex-col items-center md:items-start justify-between md:justify-start gap-1">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">System</p>
                           <p className="text-[11px] font-bold text-white capitalize">{t.designConfig.contentAlignment} Aligned</p>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center gap-4 text-gray-500 opacity-20">
                    <LayoutIcon size={64} />
                    <p className="font-bold">Select a template to preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:p-6 border-t border-[#2d2d30] bg-[#161618] flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 pb-10 md:pb-6">
               <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  AI Design Engine Ready
               </div>
               <div className="flex w-full md:w-auto gap-3">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 md:flex-none border-[#333] hover:bg-[#252526] text-gray-300 px-6">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newTitle.trim() || !selectedTemplateId} 
                  className="flex-[2] md:flex-none bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold px-8 shadow-lg shadow-[#D62828]/20 group"
                >
                  Create <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
