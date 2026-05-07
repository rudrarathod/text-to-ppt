import React, { useState } from "react";
import { Palette, Type, Square, Zap, ChevronDown, Copy, Check, MousePointer2, Layers, Move } from "lucide-react";
import { cn } from "../../lib/utils";
import { FontSelector } from "./FontSelector";

interface ThemeSettingsPanelProps {
  config: any;
  onChange: (updates: Partial<any>) => void;
  layout?: 'sidebar' | 'grid';
}

const TABS = [
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'geometry', label: 'Geometry', icon: Square },
  { id: 'interaction', label: 'Interaction', icon: Zap },
];

export function ThemeSettingsPanel({ config, onChange, layout = 'sidebar' }: ThemeSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('colors');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const ColorInput = ({ label, token, value }: { label: string, token: string, value: string }) => (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => handleCopy(token, value)} className="p-1 hover:bg-white/5 rounded">
             {copiedKey === token ? <Check size={10} className="text-green-500" /> : <Copy size={10} className="text-gray-500" />}
           </button>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5 focus-within:border-[#D62828]/50 transition-all">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <input 
            type="color" 
            value={value || '#000000'} 
            onChange={(e) => onChange({ [token]: e.target.value })}
            className="absolute -inset-2 w-12 h-12 cursor-pointer border-none bg-transparent p-0"
          />
        </div>
        <input 
          type="text" 
          value={value || ''}
          onChange={(e) => onChange({ [token]: e.target.value })}
          className="flex-1 bg-transparent text-white font-mono text-[10px] outline-none uppercase"
        />
      </div>
    </div>
  );

  const TypographyControl = ({ label, token, value }: { label: string, token: string, value: any }) => (
    <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-[#D62828] uppercase tracking-widest">{label}</label>
        <span className="text-[9px] font-mono text-gray-600">{value.fontSize} / {value.fontWeight}</span>
      </div>
      
      <div className="space-y-4">
        <FontSelector 
          label="Font Family"
          value={value.fontFamily}
          onChange={(v) => onChange({ [token]: { ...value, fontFamily: v } })}
          searchQuery=""
          onSearchChange={() => {}}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold">Size</span>
            <input 
              type="text" 
              value={value.fontSize}
              onChange={(e) => onChange({ [token]: { ...value, fontSize: e.target.value } })}
              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#D62828]"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold">Weight</span>
            <select 
              value={value.fontWeight}
              onChange={(e) => onChange({ [token]: { ...value, fontWeight: e.target.value } })}
              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#D62828]"
            >
              {['100', '200', '300', '400', '500', '600', '700', '800', '900'].map(w => <option key={w} value={w} className="bg-[#161618]">{w}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold">Line Height</span>
            <input 
              type="text" 
              value={value.lineHeight}
              onChange={(e) => onChange({ [token]: { ...value, lineHeight: e.target.value } })}
              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#D62828]"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold">Spacing</span>
            <input 
              type="text" 
              value={value.letterSpacing}
              onChange={(e) => onChange({ [token]: { ...value, letterSpacing: e.target.value } })}
              className="w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#D62828]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#121214] border-r border-white/5 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex p-2 bg-[#0f0f10] border-b border-white/5 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-[#D62828] text-white shadow-lg shadow-[#D62828]/20" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
        {activeTab === 'colors' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Surface Tokens */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Layers size={14} className="text-[#D62828]" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">Surface Architecture</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ColorInput label="Surface" token="surface" value={config.surface} />
                <ColorInput label="Surface Dim" token="surfaceDim" value={config.surfaceDim} />
                <ColorInput label="Surface Bright" token="surfaceBright" value={config.surfaceBright} />
                <ColorInput label="Variant" token="surfaceVariant" value={config.surfaceVariant} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <ColorInput label="Cont. Lowest" token="surfaceContainerLowest" value={config.surfaceContainerLowest} />
                <ColorInput label="Cont. Low" token="surfaceContainerLow" value={config.surfaceContainerLow} />
                <ColorInput label="Container" token="surfaceContainer" value={config.surfaceContainer} />
                <ColorInput label="Cont. High" token="surfaceContainerHigh" value={config.surfaceContainerHigh} />
                <ColorInput label="Cont. Highest" token="surfaceContainerHighest" value={config.surfaceContainerHighest} />
              </div>
            </section>

            {/* Brand Tokens */}
            <section className="space-y-8">
              {/* Primary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-[#D62828] uppercase tracking-widest">Primary Brand</h4>
                   <div className="h-px flex-1 bg-white/5 mx-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <ColorInput label="Primary" token="primary" value={config.primary} />
                   <ColorInput label="On Primary" token="onPrimary" value={config.onPrimary} />
                   <ColorInput label="Container" token="primaryContainer" value={config.primaryContainer} />
                   <ColorInput label="On Container" token="onPrimaryContainer" value={config.onPrimaryContainer} />
                </div>
              </div>

              {/* Secondary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Secondary System</h4>
                   <div className="h-px flex-1 bg-white/5 mx-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <ColorInput label="Secondary" token="secondary" value={config.secondary} />
                   <ColorInput label="On Secondary" token="onSecondary" value={config.onSecondary} />
                   <ColorInput label="Container" token="secondaryContainer" value={config.secondaryContainer} />
                   <ColorInput label="On Container" token="onSecondaryContainer" value={config.onSecondaryContainer} />
                </div>
              </div>

              {/* Tertiary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tertiary Accent</h4>
                   <div className="h-px flex-1 bg-white/5 mx-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <ColorInput label="Tertiary" token="tertiary" value={config.tertiary} />
                   <ColorInput label="On Tertiary" token="onTertiary" value={config.onTertiary} />
                   <ColorInput label="Container" token="tertiaryContainer" value={config.tertiaryContainer} />
                   <ColorInput label="On Container" token="onTertiaryContainer" value={config.onTertiaryContainer} />
                </div>
              </div>
            </section>

            {/* Utility Tokens */}
            <section className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <ColorInput label="Background" token="background" value={config.background} />
                  <ColorInput label="Outline" token="outline" value={config.outline} />
                  <ColorInput label="Error" token="error" value={config.error} />
                  <ColorInput label="On Error" token="onError" value={config.onError} />
               </div>
            </section>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <TypographyControl label="Display XL" token="typeDisplayXl" value={config.typeDisplayXl} />
            <TypographyControl label="Headline LG" token="typeHeadlineLg" value={config.typeHeadlineLg} />
            <TypographyControl label="Headline MD" token="typeHeadlineMd" value={config.typeHeadlineMd} />
            <TypographyControl label="Body LG" token="typeBodyLg" value={config.typeBodyLg} />
            <TypographyControl label="Body MD" token="typeBodyMd" value={config.typeBodyMd} />
            <TypographyControl label="Label SM" token="typeLabelSm" value={config.typeLabelSm} />
            <TypographyControl label="Caption" token="typeCaption" value={config.typeCaption} />
          </div>
        )}

        {activeTab === 'geometry' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Border Radius */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Square size={14} className="text-[#D62828]" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">Radius System</h4>
              </div>
              <div className="space-y-6 bg-white/5 p-5 rounded-2xl border border-white/5">
                {[
                  { label: 'Small', token: 'radiusSm' },
                  { label: 'Default', token: 'radiusDefault' },
                  { label: 'Medium', token: 'radiusMd' },
                  { label: 'Large', token: 'radiusLg' },
                  { label: 'Extra Large', token: 'radiusXl' },
                ].map(r => (
                  <div key={r.token} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>{r.label}</span>
                      <span className="font-mono text-[#D62828]">{config[r.token]}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="64" 
                      value={parseInt(config[r.token]) || 0}
                      onChange={(e) => onChange({ [r.token]: `${e.target.value}px` })}
                      className="w-full accent-[#D62828]"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Spacing System */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Move size={14} className="text-[#D62828]" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">Spacing & Density</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {['spacingBase', 'spacingXs', 'spacingSm', 'spacingMd', 'spacingLg', 'spacingXl'].map(s => (
                   <div key={s} className="space-y-1.5">
                     <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{s.replace('spacing', '')}</span>
                     <input 
                        type="text" 
                        value={config[s]}
                        onChange={(e) => onChange({ [s]: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#D62828]"
                     />
                   </div>
                 ))}
              </div>
            </section>

            {/* Shadows */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                <Layers size={14} className="text-[#D62828]" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">Elevation & Shadows</h4>
              </div>
              <div className="space-y-4">
                 {['shadowSm', 'shadowMd', 'shadowLg', 'shadowXl'].map(s => (
                   <div key={s} className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s}</span>
                      <textarea 
                        value={config[s]}
                        onChange={(e) => onChange({ [s]: e.target.value })}
                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-[10px] text-gray-400 font-mono outline-none focus:border-[#D62828] resize-none h-20"
                      />
                   </div>
                 ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'interaction' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <section className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <MousePointer2 size={14} className="text-[#D62828]" />
                <h4 className="text-xs font-black text-white uppercase tracking-tighter">State Behaviors</h4>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Hover Opacity</span>
                    <span className="text-[#D62828]">{config.interactionHoverOpacity}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={config.interactionHoverOpacity}
                    onChange={(e) => onChange({ interactionHoverOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-[#D62828]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>Active Scale</span>
                    <span className="text-[#D62828]">{config.interactionActiveScale}</span>
                  </div>
                  <input 
                    type="range" min="0.8" max="1.1" step="0.01"
                    value={config.interactionActiveScale}
                    onChange={(e) => onChange({ interactionActiveScale: parseFloat(e.target.value) })}
                    className="w-full accent-[#D62828]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Focus Glow</span>
                    <input 
                      type="text" 
                      value={config.interactionFocusGlow}
                      onChange={(e) => onChange({ interactionFocusGlow: e.target.value })}
                      className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828]"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Timing (ms)</span>
                    <input 
                      type="text" 
                      value={config.interactionTransitionTiming}
                      onChange={(e) => onChange({ interactionTransitionTiming: e.target.value })}
                      className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828]"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
