import { useState } from "react";
import { useAppStore, DesignConfig } from "../store";
import { Button } from "../components/ui";
import { Plus, Presentation as PresentationIcon, Trash2, Edit2, Layout as LayoutIcon, ChevronRight, ChevronLeft, X, Search, ArrowUpDown, Play } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";

import { SlidePreview } from "../components/SlidePreview";
import { PageHeader } from "../components/layout/PageHeader";
import { PreviewCard } from "../components/layout/PreviewCard";
import { FullScreenModal } from "../components/layout/FullScreenModal";

export function PresentationGallery() {
  const { presentations, activePresentationId, createPresentation, deletePresentation, setActivePresentation, templates, createTemplate, updateActiveTemplateDesign, setSlides } = useAppStore();
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
    navigate(`/presentations/${newId}`);
  };



  const filteredTemplates = templates
    .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()))
    .sort((a, b) => {
      if (templateSort === 'name') return a.name.localeCompare(b.name);
      if (templateSort === 'layouts') return b.layouts.length - a.layouts.length;
      if (templateSort === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });

  return (
    <div className="flex flex-col h-full bg-[#111111] overflow-auto text-gray-200">
      <PageHeader 
        title="Presentations"
        icon={<PresentationIcon size={16} className="text-[#D62828]" />}
      />

      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {presentations.map(presentation => {
            const currentTemplate = templates.find(t => t.id === presentation.templateId);
            return (
              <PreviewCard 
                key={presentation.id}
                title={presentation.name}
                badge={<span className="text-[10px] text-gray-600 bg-gray-400/5 px-2 py-0.5 rounded border border-gray-400/10">{currentTemplate?.name || "No Template"}</span>}
                footer={
                  <div className="flex items-center gap-2">
                    <span className="bg-[#2d2d30] px-2 py-0.5 rounded text-gray-300">{presentation.slides.length} Slides</span>
                    <span>&bull;</span>
                    <span>{formatDistanceToNow(presentation.updatedAt, { addSuffix: true })}</span>
                  </div>
                }
                onClick={() => {
                  setActivePresentation(presentation.id);
                  navigate(`/presentations/${presentation.id}`);
                }}
                preview={
                  <div 
                    className="w-full h-full relative flex items-center justify-center"
                    style={{ backgroundColor: currentTemplate?.designConfig.bg || '#fff' }}
                  >
                    <h3 
                      className="text-center font-bold px-6 line-clamp-3 text-xl drop-shadow-sm pointer-events-none"
                      style={{ color: currentTemplate?.designConfig.primary || '#000' }}
                    >
                       {presentation.slides[0]?.content.title || presentation.name}
                    </h3>
                  </div>
                }
                topRightActions={
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${presentation.name}"?`)) {
                        deletePresentation(presentation.id);
                      }
                    }}
                    className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-[#b20112] text-white rounded-lg transition-colors backdrop-blur-sm shadow-xl"
                    title="Delete Presentation"
                  >
                    <Trash2 size={14} />
                  </button>
                }
                actions={
                  <>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePresentation(presentation.id);
                        navigate(`/presentations/${presentation.id}`);
                      }}
                      className="bg-[#D62828] hover:bg-[#b20112] text-white border-none shadow-xl gap-2 font-black uppercase tracking-widest text-[10px] px-8 py-2.5 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                    >
                      <Edit2 size={14} /> Edit
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePresentation(presentation.id);
                        navigate(`/presentations/${presentation.id}/present`);
                      }}
                      className="bg-white hover:bg-gray-200 text-black border-none shadow-xl gap-2 font-black uppercase tracking-widest text-[10px] px-8 py-2.5 rounded-full transform translate-y-8 group-hover:translate-y-0 transition-all duration-300 delay-75"
                    >
                      <Play size={14} className="fill-current" /> Present
                    </Button>
                  </>
                }
              />
            );
          })}

          {/* Create New Card */}
          <div 
            onClick={() => {
              setShowCreateModal(true);
              if (templates.length > 0) {
                setSelectedTemplateId(templates[0].id);
                setCurrentLayoutIndex(0);
              }
            }}
            className="border-2 border-dashed border-[#2d2d30] rounded-xl flex flex-col items-center justify-center p-8 text-gray-500 hover:text-white hover:border-gray-500 hover:bg-gray-500/10 transition-all cursor-pointer min-h-[260px] bg-[#161618]"
          >
             <div className="w-16 h-16 rounded-full bg-[#2d2d30] flex items-center justify-center mb-5 group-hover:bg-gray-500 shadow-sm transition-colors">
               <Plus size={32} className="text-gray-400 group-hover:text-white" />
             </div>
             <p className="font-bold font-display text-xl text-white">Manual Presentation</p>
          </div>


        </div>
      </div>      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[#1e1e1e] border border-[#2d2d30] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-[#2d2d30] bg-[#161618]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D62828]/10 flex items-center justify-center">
                  <PresentationIcon className="text-[#D62828]" size={24}/>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create New Presentation</h3>
                  <p className="text-xs text-gray-500">Select a design style to get started</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* Left Sidebar: Template List */}
              <div className="w-80 border-r border-[#2d2d30] flex flex-col bg-[#161618]/50">
                <div className="p-6 pb-0">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Presentation Title</label>
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

                <div className="mt-8 flex-1 flex flex-col min-h-0">
                  <div className="px-6 space-y-4 mb-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Design Library</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                      <input 
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search designs..."
                        className="w-full bg-[#1e1e1e] border border-[#2d2d30] rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#D62828] transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                       <ArrowUpDown size={12} className="text-gray-600" />
                       <select 
                         value={templateSort}
                         onChange={(e) => setTemplateSort(e.target.value as any)}
                         className="bg-transparent border-none text-[10px] font-bold text-gray-500 outline-none hover:text-white transition-colors cursor-pointer"
                       >
                          <option value="newest">Newest First</option>
                          <option value="name">Alphabetical</option>
                          <option value="layouts">Most Layouts</option>
                       </select>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-6">
                    {filteredTemplates.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setCurrentLayoutIndex(0);
                        }}
                        className={cn(
                          "group cursor-pointer p-4 rounded-xl transition-all border flex items-center justify-between",
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
                             <p className="text-xs text-gray-500 truncate">{t.layouts.length} slides</p>
                          </div>
                        </div>
                        {selectedTemplateId === t.id && (
                          <div className="w-2 h-2 rounded-full bg-[#D62828]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Large Preview Area */}
              <div className="flex-1 bg-[#111111] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D62828]/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>

                {selectedTemplateId && templates.find(t => t.id === selectedTemplateId) ? (() => {
                  const t = templates.find(temp => temp.id === selectedTemplateId)!;
                  const currentLayout = t.layouts[currentLayoutIndex] || t.layouts[0];
                  const mockData = currentLayout?.mockData || { title: t.name, subtitle: "Full Design System Preview" };
                  
                  return (
                    <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all hover:bg-[#D62828]"
                              >
                                <ChevronLeft size={24} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentLayoutIndex((prev) => (prev + 1) % t.layouts.length);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-all hover:bg-[#D62828]"
                              >
                                <ChevronRight size={24} />
                              </button>
                              
                              {/* Layout Indicator */}
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 rounded-full bg-black/40 backdrop-blur-md">
                                {t.layouts.map((_, idx) => (
                                  <div 
                                    key={idx}
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full transition-all",
                                      currentLayoutIndex === idx ? "bg-[#D62828] w-4" : "bg-white/40"
                                    )}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Layout Name Badge */}
                        <div className="absolute -top-3 left-6 px-4 py-1.5 bg-[#D62828] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                           {currentLayout?.name || "Layout Preview"}
                        </div>
                      </div>

                      <div className="w-full max-w-2xl grid grid-cols-3 gap-6">
                        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#2d2d30] space-y-2">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Brand Palette</p>
                           <div className="flex gap-1.5">
                              <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: t.designConfig.primary }} title="Primary"></div>
                              <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: t.designConfig.secondary }} title="Secondary"></div>
                              <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: t.designConfig.accent }} title="Accent"></div>
                              <div className="w-6 h-6 rounded-md shadow-inner" style={{ backgroundColor: t.designConfig.bg }} title="Background"></div>
                           </div>
                        </div>
                        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#2d2d30] space-y-1">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Typography</p>
                           <p className="text-xs font-bold text-white truncate">{t.designConfig.headingFont}</p>
                           <p className="text-[10px] text-gray-500 truncate">{t.designConfig.fontFamily}</p>
                        </div>
                        <div className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#2d2d30] space-y-1">
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Interface</p>
                           <p className="text-xs font-bold text-white">Radius: {t.designConfig.borderRadius}</p>
                           <p className="text-[10px] text-gray-500 capitalize">{t.designConfig.contentAlignment} Aligned</p>
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

            <div className="p-6 border-t border-[#2d2d30] bg-[#161618] flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  AI Design Engine Ready
               </div>
               <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-[#333] hover:bg-[#252526] text-gray-300 px-6">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newTitle.trim() || !selectedTemplateId} 
                  className="bg-[#D62828] hover:bg-[#b20112] text-white border-none font-bold px-8 shadow-lg shadow-[#D62828]/20 group"
                >
                  Create Presentation <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
