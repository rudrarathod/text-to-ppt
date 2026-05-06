import React, { useState } from "react";
import { Palette, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { FontSelector } from "./FontSelector";

interface ThemeSettingsPanelProps {
  config: any;
  onChange: (updates: Partial<any>) => void;
  layout?: 'sidebar' | 'grid';
}

export function ThemeSettingsPanel({ config, onChange, layout = 'sidebar' }: ThemeSettingsPanelProps) {
  const [fontSearch, setFontSearch] = useState({ heading: "", body: "" });

  const isGrid = layout === 'grid';

  return (
    <div className={cn("space-y-8", isGrid ? "space-y-12" : "space-y-10")}>
      {/* Colors Section */}
      <section className={cn("space-y-4", isGrid && "space-y-6")}>
        {isGrid ? (
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Palette size={14} className="text-[#D62828]" /> Brand Palette
          </h4>
        ) : (
          <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">Core Palette</label>
        )}
        <div className={cn("space-y-3", isGrid && "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0")}>
          {[
            { label: 'Primary', key: 'primary' },
            { label: 'Secondary', key: 'secondary' },
            { label: 'Accent', key: 'accent' },
            { label: 'Background', key: 'bg' },
            { label: 'Surface', key: 'surface' },
            { label: 'Contrast', key: 'surfaceContrast' },
            { label: 'Border', key: 'border' },
          ].map(item => (
            <div key={item.key} className={cn("group", !isGrid && "flex items-center justify-between")}>
              {isGrid ? (
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">{item.label}</label>
              ) : (
                <span className="text-xs text-gray-400 font-medium">{item.label}</span>
              )}
              
              <div className={cn(
                "flex items-center gap-2",
                isGrid ? "bg-white/5 p-2 rounded-xl border border-white/5 group-focus-within:border-[#D62828]/50 transition-all" : ""
              )}>
                <div className={cn("relative rounded overflow-hidden shrink-0", isGrid ? "w-10 h-10" : "w-6 h-6 border border-white/10")}>
                  <input 
                    type="color" 
                    value={config[item.key] || '#000000'} 
                    onChange={(e) => onChange({ [item.key]: e.target.value })}
                    className={cn("cursor-pointer border-none bg-transparent p-0", isGrid ? "w-full h-full rounded-lg" : "absolute -inset-2 w-10 h-10")}
                  />
                </div>
                {isGrid && (
                  <input 
                    type="text" 
                    value={config[item.key] || ''}
                    onChange={(e) => onChange({ [item.key]: e.target.value })}
                    className="flex-1 bg-transparent text-white font-mono text-[11px] outline-none"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Section */}
      <section className={cn("space-y-4", isGrid && "space-y-6")}>
        {isGrid ? (
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Typography Systems</h4>
        ) : (
          <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">System Type</label>
        )}
        <div className={cn("space-y-4", isGrid && "space-y-8")}>
          <div className={cn(isGrid && "grid grid-cols-1 md:grid-cols-2 gap-8")}>
             <FontSelector 
               label="Heading Font"
               value={config.headingFont}
               onChange={(v) => onChange({ headingFont: v })}
               searchQuery={fontSearch.heading}
               onSearchChange={(v) => setFontSearch(prev => ({ ...prev, heading: v }))}
             />
             {!isGrid && <div className="h-2" />}
             <FontSelector 
               label="Body Font"
               value={config.fontFamily}
               onChange={(v) => onChange({ fontFamily: v })}
               searchQuery={fontSearch.body}
               onSearchChange={(v) => setFontSearch(prev => ({ ...prev, body: v }))}
             />
          </div>
          <div className={cn("grid grid-cols-2 gap-3", isGrid && "md:grid-cols-4 gap-6")}>
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">H-Size</span>
              <input 
                type="text" 
                value={config.headingSize || ''}
                onChange={(e) => onChange({ headingSize: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
              />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">Weight</span>
              <input 
                type="text" 
                value={config.headingWeight || ''}
                onChange={(e) => onChange({ headingWeight: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
              />
            </div>
            {isGrid && (
              <>
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase">B-Size</span>
                  <input 
                    type="text" 
                    value={config.bodySize || ''}
                    onChange={(e) => onChange({ bodySize: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase">Spacing</span>
                  <input 
                    type="text" 
                    value={config.letterSpacing || ''}
                    onChange={(e) => onChange({ letterSpacing: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Geometry Section */}
      <section className={cn("space-y-4", isGrid && "space-y-6")}>
        {isGrid ? (
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Geometry & Layout</h4>
        ) : (
          <label className="block text-[10px] font-black text-[#D62828] uppercase tracking-widest mb-4">Geometry</label>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">Radius</span>
              {isGrid ? (
                <select 
                  value={config.borderRadius}
                  onChange={(e) => onChange({ borderRadius: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                >
                  {[
                    { name: 'None', value: '0px' },
                    { name: 'Small', value: '0.25rem' },
                    { name: 'Medium', value: '0.5rem' },
                    { name: 'Large', value: '0.75rem' },
                    { name: 'X-Large', value: '1.25rem' },
                    { name: 'Full', value: '9999px' },
                  ].map(r => <option key={r.value} value={r.value} className="bg-[#161618]">{r.name}</option>)}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={config.cardRadius || config.borderRadius || ''}
                  onChange={(e) => onChange({ cardRadius: e.target.value, borderRadius: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
                />
              )}
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">Padding</span>
              <input 
                type="text" 
                value={config.sectionPadding || ''}
                onChange={(e) => onChange({ sectionPadding: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-gray-500 uppercase font-medium">Alignment</span>
            <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => onChange({ contentAlignment: 'left' })}
                className={cn("py-1 text-[9px] font-black rounded uppercase transition-all", config.contentAlignment === 'left' ? "bg-[#D62828] text-white" : "text-gray-500")}
              >Left</button>
              <button 
                onClick={() => onChange({ contentAlignment: 'center' })}
                className={cn("py-1 text-[9px] font-black rounded uppercase transition-all", config.contentAlignment === 'center' ? "bg-[#D62828] text-white" : "text-gray-500")}
              >Center</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
