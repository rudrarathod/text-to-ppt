import React from "react";
import { Sparkles, Settings2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ThemeSettingsPanel } from "./ThemeSettingsPanel";
import { AIAssistantPanel } from "../ai/AIAssistantPanel";
import { buildDesignConfigPrompt } from "../../lib/gemini";

interface DesignSystemSidebarProps {
  width: number;
  onWidthChange: (width: number) => void;
  entryMode: 'ai' | 'manual';
  onEntryModeChange: (mode: 'ai' | 'manual') => void;
  config: any;
  onConfigChange: (updates: any) => void;
  
  // AI related
  aiPrompt: string;
  onAiPromptChange: (val: string) => void;
  aiResponse: string;
  onAiResponseChange: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onApplyResponse: () => void;
  
  // Optional extra content (like Template Identity)
  children?: React.ReactNode;
}

export function DesignSystemSidebar({
  width,
  onWidthChange,
  entryMode,
  onEntryModeChange,
  config,
  onConfigChange,
  aiPrompt,
  onAiPromptChange,
  aiResponse,
  onAiResponseChange,
  isGenerating,
  onGenerate,
  onApplyResponse,
  children
}: DesignSystemSidebarProps) {
  const isResizing = React.useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 320 && newWidth <= 800) {
      onWidthChange(newWidth);
    }
  };

  return (
    <div 
      style={{ width }}
      className="border-r border-white/5 bg-[#0c0c0e] flex flex-col overflow-hidden relative group/sidebar shrink-0 h-full"
    >
      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#D62828]/50 transition-colors z-30"
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header Area */}
        <div className="p-8 pb-4 space-y-8 bg-[#0c0c0e]">
           {children}

           {/* Design Mode Selection */}
           <div className={cn("space-y-4 pt-4", children && "border-t border-white/5")}>
             <div className="flex items-center justify-between">
               <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Visual DNA Engine</p>
               <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5">
                 <button 
                   onClick={() => onEntryModeChange('ai')}
                   className={cn(
                     "px-5 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                     entryMode === 'ai' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/20" : "text-gray-500 hover:text-gray-300"
                   )}
                 >
                   <Sparkles size={12} /> AI
                 </button>
                 <button 
                   onClick={() => onEntryModeChange('manual')}
                   className={cn(
                     "px-5 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2",
                     entryMode === 'manual' ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/20" : "text-gray-500 hover:text-gray-300"
                   )}
                 >
                   <Settings2 size={12} /> MANUAL
                 </button>
               </div>
             </div>
           </div>
        </div>

        <div className="flex-1">
          {entryMode === 'ai' ? (
            <div className="p-8 pt-4 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <AIAssistantPanel 
                promptValue={aiPrompt}
                onPromptChange={onAiPromptChange}
                onGenerate={onGenerate}
                isGenerating={isGenerating}
                placeholder="Describe your brand's personality, colors, or mood..."
                defaultMode="ai"
                onModeChange={() => {}}
                systemPromptBuilder={buildDesignConfigPrompt}
                responseValue={aiResponse}
                onResponseChange={onAiResponseChange}
                onApplyResponse={onApplyResponse}
              />

              <div className="space-y-4">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-1">Design Presets</p>
                <div className="flex flex-wrap gap-2">
                  {['Neon Noir', 'Brutalist', 'Luxury', 'Startup'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => { onAiPromptChange(tag); onGenerate(); }}
                      className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-gray-400 hover:text-white hover:border-[#D62828] transition-all uppercase tracking-widest"
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
                config={config}
                onChange={onConfigChange}
                layout="sidebar"
                width={width}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
