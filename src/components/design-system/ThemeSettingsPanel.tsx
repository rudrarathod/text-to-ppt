import React, { useState } from "react";
import { Palette, Type, Square, Zap, ChevronDown, Copy, Check, MousePointer2, Layers, Move, Settings, CircleAlert } from "lucide-react";
import { cn, copyToClipboard } from "../../lib/utils";
import { FontSelector } from "./FontSelector";

interface ThemeSettingsPanelProps {
  config: any;
  onChange: (updates: Partial<any>) => void;
  layout?: 'sidebar' | 'grid';
  width?: number;
}

const TABS = [
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'geometry', label: 'Geometry', icon: Square },
  { id: 'interaction', label: 'Interaction', icon: Zap },
];

export function ThemeSettingsPanel({ config, onChange, layout = 'sidebar', width }: ThemeSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('colors');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isWide = width && width > 650;
  const isExtraWide = width && width > 750;
  const cols2 = isWide ? "grid-cols-4" : "grid-cols-2";
  const cols3 = isExtraWide ? "grid-cols-5" : "grid-cols-3";
  const gridGap = "gap-x-8 gap-y-6";

  const handleCopy = (key: string, value: string) => {
    copyToClipboard(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const ColorInput = ({ label, token, value }: { label: string, token: string, value: string }) => (
    <div className="group space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</label>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
             onClick={() => handleCopy(token, value)} 
             className="p-1 hover:bg-white/10 rounded-md transition-colors"
             title="Copy Hex"
           >
             {copiedKey === token ? <Check size={8} className="text-green-500" /> : <Copy size={8} className="text-gray-500 hover:text-white" />}
           </button>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-full border border-white/5 hover:border-white/10 focus-within:border-[#D62828]/50 transition-all shadow-inner min-w-[110px]">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm">
          <input 
            type="color" 
            value={value || '#000000'} 
            onChange={(e) => onChange({ [token]: e.target.value })}
            className="absolute -inset-2 w-12 h-12 cursor-pointer border-none bg-transparent p-0 scale-150"
          />
        </div>
        <input 
          type="text" 
          value={value || ''}
          onChange={(e) => onChange({ [token]: e.target.value })}
          className="flex-1 bg-transparent text-white font-mono text-[10px] outline-none uppercase tracking-wider min-w-0"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const TypographyControl = ({ label, token, value }: { label: string, token: string, value: any }) => (
    <div className="space-y-4 p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
           <div className="w-1 h-3 bg-[#D62828] rounded-full" />
           <label className="text-[10px] font-black text-white uppercase tracking-widest">{label}</label>
        </div>
        <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{value.fontSize} / {value.fontWeight}</span>
      </div>
      
      <div className={cn("space-y-4", isWide && "grid grid-cols-2 gap-8 space-y-0 items-end")}>
        <FontSelector 
          label="Typeface"
          value={value.fontFamily}
          onChange={(v) => onChange({ [token]: { ...value, fontFamily: v } })}
          searchQuery=""
          onSearchChange={() => {}}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Size</span>
            <input 
              type="text" 
              value={value.fontSize}
              onChange={(e) => onChange({ [token]: { ...value, fontSize: e.target.value } })}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Weight</span>
            <select 
              value={value.fontWeight}
              onChange={(e) => onChange({ [token]: { ...value, fontWeight: e.target.value } })}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
            >
              {['100', '200', '300', '400', '500', '600', '700', '800', '900'].map(w => <option key={w} value={w} className="bg-[#161618]">{w}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Line Height</span>
            <input 
              type="text" 
              value={value.lineHeight}
              onChange={(e) => onChange({ [token]: { ...value, lineHeight: e.target.value } })}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Letter Spacing</span>
            <input 
              type="text" 
              value={value.letterSpacing}
              onChange={(e) => onChange({ [token]: { ...value, letterSpacing: e.target.value } })}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] overflow-hidden">
      {/* Header Label - Optional, but adds 'proper' tool feel */}
      <div className="px-6 pt-6 pb-2">
         <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Design System Configuration</p>
      </div>

      {/* Tab Navigation - Capsule Independent Look */}
      <div className="p-4 pt-2">
        <div className="flex flex-wrap gap-2 bg-white/[0.02] p-1.5 rounded-[2rem] border border-white/5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group flex items-center gap-2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden",
                activeTab === tab.id 
                  ? "bg-[#D62828] text-white shadow-[0_4px_15px_-4px_rgba(214,40,40,0.4)]" 
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
              )}
            >
              <tab.icon size={12} className={cn(
                "transition-transform duration-300 relative z-10",
                activeTab === tab.id ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
        {activeTab === 'colors' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Surface Tokens */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Layers size={14} className="text-[#D62828]" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Surface Architecture</h4>
              </div>
              <div className={cn("grid", gridGap, cols2)}>
                <ColorInput label="Surface" token="surface" value={config.surface} />
                <ColorInput label="Surface Dim" token="surfaceDim" value={config.surfaceDim} />
                <ColorInput label="Surface Bright" token="surfaceBright" value={config.surfaceBright} />
                <ColorInput label="Variant" token="surfaceVariant" value={config.surfaceVariant} />
              </div>
              <div className={cn("grid", gridGap, cols3)}>
                <ColorInput label="Lowest" token="surfaceContainerLowest" value={config.surfaceContainerLowest} />
                <ColorInput label="Low" token="surfaceContainerLow" value={config.surfaceContainerLow} />
                <ColorInput label="Container" token="surfaceContainer" value={config.surfaceContainer} />
                <ColorInput label="High" token="surfaceContainerHigh" value={config.surfaceContainerHigh} />
                <ColorInput label="Highest" token="surfaceContainerHighest" value={config.surfaceContainerHighest} />
              </div>
            </section>

            {/* Brand Tokens */}
            <section className="space-y-10">
              {/* Primary */}
              <div className="space-y-6 bg-white/[0.01] p-6 rounded-3xl border border-white/5 shadow-inner">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#D62828] animate-pulse" />
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Primary Brand</h4>
                </div>
                 <div className={cn("grid", gridGap, cols2)}>
                    <ColorInput label="Base" token="primary" value={config.primary} />
                    <ColorInput label="On" token="onPrimary" value={config.onPrimary} />
                    <ColorInput label="Container" token="primaryContainer" value={config.primaryContainer} />
                    <ColorInput label="On Cont." token="onPrimaryContainer" value={config.onPrimaryContainer} />
                 </div>
                 
                 <div className="pt-4 space-y-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fixed Variants</p>
                    <div className={cn("grid", gridGap, cols2)}>
                       <ColorInput label="Fixed" token="primaryFixed" value={config.primaryFixed} />
                       <ColorInput label="Fixed Dim" token="primaryFixedDim" value={config.primaryFixedDim} />
                       <ColorInput label="On Fixed" token="onPrimaryFixed" value={config.onPrimaryFixed} />
                       <ColorInput label="On Fixed V." token="onPrimaryFixedVariant" value={config.onPrimaryFixedVariant} />
                    </div>
                 </div>
              </div>

              {/* Secondary & Tertiary Grid */}
              <div className={cn("grid gap-8", isWide ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-6 bg-white/[0.01] p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Secondary</h4>
                   <div className={cn("grid grid-cols-2", gridGap)}>
                      <ColorInput label="Base" token="secondary" value={config.secondary} />
                      <ColorInput label="On" token="onSecondary" value={config.onSecondary} />
                      <ColorInput label="Cont." token="secondaryContainer" value={config.secondaryContainer} />
                      <ColorInput label="On C." token="onSecondaryContainer" value={config.onSecondaryContainer} />
                   </div>
                </div>
                <div className="space-y-6 bg-white/[0.01] p-6 rounded-3xl border border-white/5">
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Tertiary</h4>
                   <div className={cn("grid grid-cols-2", gridGap)}>
                      <ColorInput label="Base" token="tertiary" value={config.tertiary} />
                      <ColorInput label="On" token="onTertiary" value={config.onTertiary} />
                      <ColorInput label="Cont." token="tertiaryContainer" value={config.tertiaryContainer} />
                      <ColorInput label="On C." token="onTertiaryContainer" value={config.onTertiaryContainer} />
                   </div>
                </div>
              </div>
            </section>

            {/* Utility Tokens */}
            <section className="space-y-6">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <Settings size={14} className="text-gray-500" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Utility & Inverse</h4>
               </div>
               <div className={cn("grid", gridGap, cols2)}>
                  <ColorInput label="Background" token="background" value={config.background} />
                  <ColorInput label="Outline" token="outline" value={config.outline} />
                  <ColorInput label="Inverse Surf." token="inverseSurface" value={config.inverseSurface} />
                  <ColorInput label="Inverse On" token="inverseOnSurface" value={config.inverseOnSurface} />
               </div>
            </section>

            {/* Error System */}
            <section className="space-y-6">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <CircleAlert size={14} className="text-red-500" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Error System</h4>
               </div>
               <div className={cn("grid", gridGap, cols2)}>
                  <ColorInput label="Base" token="error" value={config.error} />
                  <ColorInput label="On" token="onError" value={config.onError} />
                  <ColorInput label="Container" token="errorContainer" value={config.errorContainer} />
                  <ColorInput label="On Cont." token="onErrorContainer" value={config.onErrorContainer} />
               </div>
            </section>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
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
            <section className="space-y-8">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Square size={14} className="text-[#D62828]" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Radius System</h4>
              </div>
              <div className={cn("bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-inner", isWide ? "grid grid-cols-2 gap-x-12 gap-y-8" : "space-y-8")}>
                {[
                  { label: 'Small', token: 'radiusSm' },
                  { label: 'Default', token: 'radiusDefault' },
                  { label: 'Medium', token: 'radiusMd' },
                  { label: 'Large', token: 'radiusLg' },
                  { label: 'Extra Large', token: 'radiusXl' },
                ].map(r => (
                  <div key={r.token} className="space-y-3">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">
                      <span>{r.label}</span>
                      <span className="font-mono text-[#D62828] bg-[#D62828]/10 px-2 py-0.5 rounded-full">{config[r.token]}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="64" 
                      value={parseInt(config[r.token]) || 0}
                      onChange={(e) => onChange({ [r.token]: `${e.target.value}px` })}
                      className="w-full accent-[#D62828] h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Spacing System */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Move size={14} className="text-[#D62828]" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Spacing & Density</h4>
              </div>
              <div className={cn("grid gap-4", isWide ? "grid-cols-4" : "grid-cols-2")}>
                 {['spacingBase', 'spacingXs', 'spacingSm', 'spacingMd', 'spacingLg', 'spacingXl', 'spacingGutter'].map(s => (
                   <div key={s} className="space-y-2">
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">{s.replace('spacing', '')}</span>
                     <div className="bg-white/[0.03] p-2 rounded-xl border border-white/5">
                        <input 
                           type="text" 
                           value={config[s]}
                           onChange={(e) => onChange({ [s]: e.target.value })}
                           className="w-full bg-transparent text-white font-mono text-[10px] outline-none"
                        />
                     </div>
                   </div>
                 ))}
              </div>
            </section>

            {/* Shadows */}
            <section className="space-y-8">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                 <Layers size={14} className="text-[#D62828]" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Elevation & Shadows</h4>
               </div>
               <div className="grid grid-cols-1 gap-6">
                 {['shadowSm', 'shadowMd', 'shadowLg', 'shadowXl'].map(s => (
                   <div key={s} className="space-y-3">
                      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">{s.replace('shadow', 'Shadow ')}</span>
                      <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                        <input 
                           type="text" 
                           value={config[s]}
                           onChange={(e) => onChange({ [s]: e.target.value })}
                           className="w-full bg-transparent text-white font-mono text-[10px] outline-none"
                        />
                      </div>
                   </div>
                 ))}
               </div>
            </section>
          </div>
        )}

        {activeTab === 'interaction' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <section className="space-y-8 bg-white/[0.01] p-8 rounded-3xl border border-white/5 shadow-inner">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <MousePointer2 size={14} className="text-[#D62828]" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Interaction State Behaviors</h4>
              </div>
              
              <div className={cn("space-y-8", isWide && "grid grid-cols-2 gap-x-12 gap-y-0 items-start")}>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">
                      <span>Hover Opacity</span>
                      <span className="text-[#D62828] bg-[#D62828]/10 px-2 py-0.5 rounded-full">{config.interactionHoverOpacity}</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={config.interactionHoverOpacity}
                      onChange={(e) => onChange({ interactionHoverOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-[#D62828] h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">
                      <span>Active Scale</span>
                      <span className="text-[#D62828] bg-[#D62828]/10 px-2 py-0.5 rounded-full">{config.interactionActiveScale}</span>
                    </div>
                    <input 
                      type="range" min="0.8" max="1.1" step="0.01"
                      value={config.interactionActiveScale}
                      onChange={(e) => onChange({ interactionActiveScale: parseFloat(e.target.value) })}
                      className="w-full accent-[#D62828] h-1.5 bg-white/5 rounded-full cursor-pointer appearance-none"
                    />
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Focus Glow</span>
                    <input 
                      type="text" 
                      value={config.interactionFocusGlow}
                      onChange={(e) => onChange({ interactionFocusGlow: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Transition Timing</span>
                    <input 
                      type="text" 
                      value={config.interactionTransitionTiming}
                      onChange={(e) => onChange({ interactionTransitionTiming: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-[10px] text-white outline-none focus:border-[#D62828] transition-all"
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
