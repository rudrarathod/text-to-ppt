import React from 'react';
import { Search, Plus, Play, Download, Settings, Heart, Bell, Share2, Info, ChevronRight, User, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GoogleFontLoader } from '../../lib/typography';

interface ThemeShowcaseProps {
  config: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    surface: string;
    surfaceContrast: string;
    textPrimary: string;
    textSecondary: string;
    fontFamily: string;
    headingFont: string;
    headingWeight: string;
    headingSize: string;
    bodySize: string;
    letterSpacing: string;
    borderRadius: string;
    buttonRadius: string;
    cardRadius: string;
    border: string;
    shadowSoft: string;
    shadowStrong: string;
    contentAlignment: 'left' | 'center';
  };
}

// Helper to generate tonal palette (simulated)
const getTonalPalette = (hex: string) => {
  // Simple simulation of tones by adjusting opacity/brightness
  // In a real app we might use chroma-js or similar
  return [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100].map(tone => {
    // Just a placeholder calculation for visual representation
    const opacity = tone / 100;
    return { tone, color: hex, opacity };
  });
};

export const ThemeShowcase: React.FC<ThemeShowcaseProps> = ({ config }) => {
  const cssVars = {
    '--ds-primary': config.primary,
    '--ds-secondary': config.secondary,
    '--ds-tertiary': config.accent,
    '--ds-surface': config.bg,
    '--ds-surface-container': config.surface,
    '--ds-on-surface': config.textPrimary,
    '--ds-on-surface-variant': config.textSecondary,
    '--ds-outline': config.border,
    '--ds-error': '#D62828',
    '--ds-font-heading': config.headingFont,
    '--ds-font-body': config.fontFamily,
    '--ds-radius-card': config.cardRadius,
    '--ds-radius-btn': config.buttonRadius,
    '--ds-shadow-soft': config.shadowSoft,
    '--ds-shadow-strong': config.shadowStrong,
  } as React.CSSProperties;

  return (
    <div style={cssVars} className="w-full max-w-[1400px] mx-auto p-4 lg:p-8 animate-in fade-in duration-700">
      <GoogleFontLoader fonts={[config.fontFamily, config.headingFont]} />
      
      <div className="grid grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Section: Color Token Cards */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="mb-6">
            <h3 className="text-white text-xl font-black tracking-tight mb-1">Design Tokens</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Visual DNA Foundations</p>
          </div>

          {[
            { label: 'Primary', token: 'primary', value: config.primary },
            { label: 'Secondary', token: 'secondary', value: config.secondary },
            { label: 'Tertiary', token: 'tertiary', value: config.accent },
            { label: 'Neutral', token: 'neutral', value: config.textSecondary },
          ].map((item) => (
            <div 
              key={item.label}
              className="bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] overflow-hidden shadow-lg transition-all hover:scale-[1.02]"
              style={{ borderRadius: 'var(--ds-radius-card)' }}
            >
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[var(--ds-on-surface-variant)] font-bold uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-[var(--ds-on-surface)] font-black text-lg tracking-tight">{item.value.toUpperCase()}</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl shadow-inner border border-white/5" 
                  style={{ backgroundColor: item.value }}
                />
              </div>
              
              {/* Tonal Palette Strip */}
              <div className="flex h-10 w-full mt-2">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100].map((tone) => (
                  <div 
                    key={tone}
                    className="flex-1 cursor-pointer hover:opacity-70 transition-opacity relative group"
                    style={{ 
                      backgroundColor: item.value,
                      filter: `brightness(${tone / 60 + 0.4}) saturate(${tone > 50 ? 1 : 1.5})`
                    }}
                    title={`Tone ${tone}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white opacity-0 group-hover:opacity-100">{tone}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Section: Component Showcase Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Typography Preview */}
            <div className="col-span-1 md:col-span-2 p-6 bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] shadow-md overflow-hidden" style={{ borderRadius: 'var(--ds-radius-card)' }}>
              <div className="flex items-center justify-between mb-8">
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Typography System</p>
                 <span className="text-[10px] font-mono opacity-50">{config.headingFont} / {config.fontFamily}</span>
              </div>
              
              <div className="flex items-end gap-8">
                <div className="text-8xl font-black leading-none tracking-tighter" style={{ fontFamily: 'var(--ds-font-heading)', color: 'var(--ds-primary)' }}>Aa</div>
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em]">Headline Large</p>
                    <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'var(--ds-font-heading)', color: 'var(--ds-on-surface)' }}>Design is Intelligence.</h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em]">Body Medium</p>
                    <p className="text-sm opacity-70 leading-relaxed" style={{ fontFamily: 'var(--ds-font-body)', color: 'var(--ds-on-surface)' }}>The goal of a designer is to listen, observe, and understand the visual language of the future.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons Preview */}
            <div className="p-6 bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] shadow-md space-y-4" style={{ borderRadius: 'var(--ds-radius-card)' }}>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Button Tokens</p>
               <button 
                  className="w-full py-3 text-white text-xs font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]" 
                  style={{ backgroundColor: 'var(--ds-primary)', borderRadius: 'var(--ds-radius-btn)' }}
               >Primary</button>
               <button 
                  className="w-full py-3 text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5" 
                  style={{ backgroundColor: 'var(--ds-secondary)', borderRadius: 'var(--ds-radius-btn)' }}
               >Secondary</button>
               <button 
                  className="w-full py-3 bg-transparent border-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5" 
                  style={{ borderColor: 'var(--ds-outline)', color: 'var(--ds-on-surface)', borderRadius: 'var(--ds-radius-btn)' }}
               >Outlined</button>
            </div>

            {/* Form & Navigation */}
            <div className="p-6 bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] shadow-md space-y-6" style={{ borderRadius: 'var(--ds-radius-card)' }}>
               <div>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Form Elements</p>
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:text-[var(--ds-primary)] group-focus-within:opacity-100 transition-all" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search design..." 
                      className="w-full bg-black/10 border border-transparent focus:border-[var(--ds-primary)] focus:bg-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs text-[var(--ds-on-surface)] outline-none transition-all"
                    />
                 </div>
               </div>
               
               <div>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Navigation Pills</p>
                 <div className="flex gap-2">
                    <div className="px-4 py-1.5 bg-[var(--ds-primary)] text-white text-[10px] font-black rounded-full">Active</div>
                    <div className="px-4 py-1.5 bg-black/10 text-[var(--ds-on-surface-variant)] text-[10px] font-bold rounded-full hover:bg-black/20 cursor-pointer">Default</div>
                 </div>
               </div>
            </div>

            {/* Progress & Indicators */}
            <div className="p-6 bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] shadow-md space-y-6" style={{ borderRadius: 'var(--ds-radius-card)' }}>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Progress Bars</p>
               <div className="space-y-4">
                  <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full w-[70%] rounded-full" style={{ backgroundColor: 'var(--ds-primary)' }} />
                  </div>
                  <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] rounded-full" style={{ backgroundColor: 'var(--ds-secondary)' }} />
                  </div>
                  <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full w-[90%] rounded-full" style={{ backgroundColor: 'var(--ds-tertiary)' }} />
                  </div>
               </div>
               
               <div className="pt-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Chips</p>
                  <div className="flex flex-wrap gap-2">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--ds-primary)]/10 text-[var(--ds-primary)] border border-[var(--ds-primary)]/20 rounded-lg text-[10px] font-bold">
                        <Palette size={10} /> Brand DNA
                     </div>
                     <div className="px-3 py-1 bg-black/10 text-[var(--ds-on-surface-variant)] rounded-lg text-[10px] font-bold">Material 3</div>
                  </div>
               </div>
            </div>

            {/* Icons & Controls */}
            <div className="p-6 bg-[var(--ds-surface-container)] border border-[var(--ds-outline)] shadow-md" style={{ borderRadius: 'var(--ds-radius-card)' }}>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-5">Icon Sets</p>
               <div className="grid grid-cols-4 gap-4">
                  {[Play, Bell, Heart, Share2, Info, User, Settings, Download].map((Icon, i) => (
                    <div 
                      key={i} 
                      className="aspect-square flex items-center justify-center rounded-2xl border transition-all hover:bg-white/5 cursor-pointer"
                      style={{ 
                        borderColor: i === 0 ? 'var(--ds-primary)' : 'var(--ds-outline)',
                        backgroundColor: i === 0 ? 'var(--ds-primary)' : 'transparent',
                        color: i === 0 ? 'white' : 'var(--ds-on-surface)'
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  ))}
               </div>
            </div>

            {/* Status Card */}
            <div className="p-6 bg-[var(--ds-primary)] text-white shadow-xl flex flex-col justify-between overflow-hidden relative" style={{ borderRadius: 'var(--ds-radius-card)' }}>
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Palette size={80} />
               </div>
               <div className="relative z-10">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">System Health</p>
                 <h4 className="text-2xl font-black tracking-tight leading-none">Operational</h4>
               </div>
               <div className="relative z-10 flex items-center justify-between mt-8">
                 <span className="text-[10px] font-mono opacity-60">VER 2.4.0</span>
                 <div className="flex -space-x-2">
                    {[1, 2, 3].map(n => <div key={n} className="w-6 h-6 rounded-full border-2 border-[var(--ds-primary)] bg-white/20 backdrop-blur-sm" />)}
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
