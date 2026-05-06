import React, { useState } from "react";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Textarea } from "../ui";
import { PromptSettingsForm } from "../PromptSettingsUI";
import { PromptSettings, buildDesignConfigPrompt } from "../../lib/gemini";

interface AIAssistantPanelProps {
  promptValue: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  showPromptSettings?: boolean;
  promptSettings?: PromptSettings;
  onPromptSettingsChange?: (settings: PromptSettings) => void;
  placeholder?: string;
  className?: string;
  modes?: { label: string; value: string }[];
  defaultMode?: string;
  onModeChange?: (mode: string) => void;
  showSystemPromptCopy?: boolean;
  systemPromptBuilder?: (prompt: string) => string;
}

export function AIAssistantPanel({
  promptValue,
  onPromptChange,
  onGenerate,
  isGenerating,
  showPromptSettings = false,
  promptSettings,
  onPromptSettingsChange,
  placeholder = "Describe your vision...",
  className,
  modes = [
    { label: "Direct AI", value: "ai" },
    { label: "Raw Prompt", value: "prompt" }
  ],
  defaultMode = "ai",
  onModeChange,
  showSystemPromptCopy = true,
  systemPromptBuilder = buildDesignConfigPrompt
}: AIAssistantPanelProps) {
  const [activeMode, setActiveMode] = useState(defaultMode);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showSettingsLocal, setShowSettingsLocal] = useState(false);

  const handleModeSwitch = (mode: string) => {
    setActiveMode(mode);
    if (onModeChange) onModeChange(mode);
  };

  const handleCopySystemPrompt = () => {
    if (!promptValue.trim()) return;
    const sysPrompt = systemPromptBuilder(promptValue);
    navigator.clipboard.writeText(sysPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className={cn("bg-[#1e1e1e] border border-[#2d2d30] rounded-xl shadow-2xl flex flex-col shrink-0 overflow-hidden w-full", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d30] bg-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D62828] animate-pulse"></div>
          <span className="text-white text-xs font-bold flex items-center gap-2 tracking-tight">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {showPromptSettings && (
             <button 
               onClick={() => setShowSettingsLocal(!showSettingsLocal)} 
               className={cn("text-[9px] font-bold px-2 py-1 rounded transition-colors", showSettingsLocal ? "bg-[#D62828] text-white" : "bg-[#252526] text-gray-400 hover:text-white border border-[#333]")}
             >
               Settings
             </button>
          )}
          {modes.length > 0 && (
            <div className="flex items-center bg-[#252526] rounded-md border border-[#333] overflow-hidden text-[9px] font-bold text-gray-400 p-0.5">
              {modes.map(mode => (
                <button 
                  key={mode.value}
                  onClick={() => handleModeSwitch(mode.value)} 
                  className={cn("px-2.5 py-1 rounded transition-colors", activeMode === mode.value ? "bg-[#2d2d30] text-white" : "hover:text-gray-200")}
                >{mode.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {showSettingsLocal && showPromptSettings && promptSettings && onPromptSettingsChange && (
           <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <PromptSettingsForm settings={promptSettings} setSettings={onPromptSettingsChange} />
             <div className="h-px bg-[#2d2d30] my-4 w-full"></div>
           </div>
        )}
        
        <div className="relative">
          <Textarea 
            value={promptValue}
            onChange={e => onPromptChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2d2d30] font-sans resize-none rounded-lg p-3 pr-12 min-h-[100px]"
            disabled={isGenerating}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (activeMode === 'ai' || !showSystemPromptCopy) {
                  onGenerate();
                } else if (promptValue.trim()) {
                  handleCopySystemPrompt();
                }
              }
            }}
          />
          <button 
            onClick={() => {
              if (activeMode === 'ai' || !showSystemPromptCopy) {
                onGenerate();
              } else if (promptValue.trim()) {
                handleCopySystemPrompt();
              }
            }}
            disabled={isGenerating || !promptValue.trim()}
            className="absolute right-3 bottom-3 text-[#5c403d] hover:text-[#D62828] disabled:opacity-50 transition-colors bg-[#1e1e1e] p-1.5 rounded-lg border border-white/5"
            title={activeMode === 'ai' || !showSystemPromptCopy ? "Generate" : "Copy System Prompt"}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : (activeMode === 'ai' || !showSystemPromptCopy ? <Sparkles size={16} /> : (copiedPrompt ? <Check size={16} className="text-green-500" /> : <Copy size={16} />))}
          </button>
        </div>
      </div>
    </div>
  );
}
