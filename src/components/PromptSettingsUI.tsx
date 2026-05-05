import React, { useState } from "react";
import { cn } from "../lib/utils";
import { X } from "lucide-react";
import { PromptSettings } from "../lib/gemini";

export const MOOD_OPTIONS = [
  { label: "Professional", value: "Professional" },
  { label: "Inspirational", value: "Inspirational" },
  { label: "Playful", value: "Playful" },
  { label: "Assertive", value: "Assertive" },
  { label: "Educational", value: "Educational" }
];

export const LANGUAGE_OPTIONS = [
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
  { label: "German", value: "German" },
  { label: "Portuguese", value: "Portuguese" },
  { label: "Japanese", value: "Japanese" }
];

export const LENGTH_OPTIONS = [
  { label: "1 Slide", value: "1 slide" },
  { label: "3 Slides", value: "3 slides" },
  { label: "5 Slides", value: "5 slides" },
  { label: "10 Slides", value: "10 slides" },
  { label: "15 Slides", value: "15 slides" }
];

export const STYLE_OPTIONS = [
  { label: "Corporate", value: "Corporate" },
  { label: "Startup Pitch", value: "Startup Pitch" },
  { label: "Academic", value: "Academic" },
  { label: "Minimalist", value: "Minimalist" },
  { label: "Storytelling", value: "Storytelling" }
];

export const PRESET_PROMPTS = [
  { label: "Pitch Deck (Startup)", value: "Create a 5-slide pitch deck for a new AI startup, including problem, solution, market size, business model, and team." },
  { label: "Quarterly Business Review", value: "Create a quarterly business review presentation highlighting key metrics, achievements, challenges, and goals for the next quarter." },
  { label: "Marketing Campaign", value: "Generate a marketing strategy presentation for a new product launch, covering target audience, channels, budget, and timeline." },
  { label: "Company All-Hands", value: "Build an all-hands company update deck with sections for company vision, recent milestones, financial health, and upcoming objectives." },
  { label: "Project Post-Mortem", value: "Create a project post-mortem presentation reviewing what went well, what could be improved, key lessons learned, and action items." }
];

export const SINGLE_SLIDE_PROMPTS = [
  { label: "Executive Summary", value: "Write an executive summary with a high-level overview of the project's goals, current status, and next steps." },
  { label: "3 Key Takeaways", value: "Generate 3 concise key takeaways focusing on market impact, technical feasibility, and financial benefits." },
  { label: "Pros and Cons", value: "Create a balanced pros and cons comparison list." },
  { label: "Call to Action", value: "Write a compelling call to action (CTA) slide with clear next steps for the audience." }
];

export const DETAIL_OPTIONS = [
  { label: "Brief / Summary", value: "Brief summary, straight to the point" },
  { label: "Bullet Points Only", value: "Short bullet points, highly concise" },
  { label: "Detailed", value: "Detailed explanations, paragraphs and lists" },
  { label: "Comprehensive", value: "Highly detailed and comprehensive analysis" }
];

export const SelectOrCustom = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  options: { label: string; value: string }[], 
  placeholder: string 
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);

  const isPredefined = options.some(o => o.value === value) || value === "";
  const showCustomInput = isCustomMode || !isPredefined;

  return (
    <div>
      <label className="block text-[10px] text-[#85858b] mb-1">{label}</label>
      {showCustomInput ? (
        <div className="flex items-center gap-1">
          <input 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder} 
            className="w-full bg-[#161618] border border-[#333] rounded-md text-xs p-1.5 text-white outline-none focus:border-[#D62828]"
            autoFocus
          />
          <button 
            onClick={() => { setIsCustomMode(false); onChange(""); }}
            className="p-1.5 bg-[#2d2d30] rounded hover:bg-[#333] text-gray-400 shrink-0"
            title="Back to list"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <select 
          value={value} 
          onChange={e => {
            if (e.target.value === "__custom__") {
              setIsCustomMode(true);
              onChange("");
            } else {
              onChange(e.target.value);
            }
          }}
          className={cn("w-full bg-[#161618] border border-[#333] rounded-md text-xs p-1.5 outline-none focus:border-[#D62828]", value ? "text-white" : "text-[#85858b]")}
        >
          <option value="">Select...</option>
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          <option value="__custom__">Custom...</option>
        </select>
      )}
    </div>
  );
};

export const PromptSettingsForm = ({ settings, setSettings }: { settings: PromptSettings, setSettings: (s: PromptSettings) => void }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <SelectOrCustom 
         label="Mood/Tone" 
         value={settings.mood || ''} 
         onChange={v => setSettings({...settings, mood: v})} 
         options={MOOD_OPTIONS} 
         placeholder="e.g. Professional" 
      />
      <SelectOrCustom 
         label="Language" 
         value={settings.language || ''} 
         onChange={v => setSettings({...settings, language: v})} 
         options={LANGUAGE_OPTIONS} 
         placeholder="e.g. English" 
      />
      <SelectOrCustom 
         label="Target Length" 
         value={settings.length || ''} 
         onChange={v => setSettings({...settings, length: v})} 
         options={LENGTH_OPTIONS} 
         placeholder="e.g. 10 slides" 
      />
      <SelectOrCustom 
         label="Detail Level" 
         value={settings.detailLevel || ''} 
         onChange={v => setSettings({...settings, detailLevel: v})} 
         options={DETAIL_OPTIONS} 
         placeholder="e.g. Brief / Summary" 
      />
      <SelectOrCustom 
         label="Style/Format" 
         value={settings.style || ''} 
         onChange={v => setSettings({...settings, style: v})} 
         options={STYLE_OPTIONS} 
         placeholder="e.g. Corporate" 
      />
    </div>
  );
};
