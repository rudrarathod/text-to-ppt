import React from 'react';
import { Search, Plus, Play, Download, Settings, Heart, Bell, Share2, Info, ChevronRight, User, Palette, MousePointer2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GoogleFontLoader } from '../../lib/typography';
import { DesignConfig } from '../../store';

interface ThemeShowcaseProps {
  config: DesignConfig;
}

export const ThemeShowcase: React.FC<ThemeShowcaseProps> = ({ config }) => {
  // Map design config to CSS variables for live preview
  const cssVars = {
    // Colors
    '--ds-primary': config.primary,
    '--ds-on-primary': config.onPrimary,
    '--ds-primary-container': config.primaryContainer,
    '--ds-on-primary-container': config.onPrimaryContainer,
    '--ds-primary-fixed': config.primaryFixed,
    '--ds-primary-fixed-dim': config.primaryFixedDim,
    '--ds-on-primary-fixed': config.onPrimaryFixed,
    '--ds-on-primary-fixed-variant': config.onPrimaryFixedVariant,
    '--ds-inverse-primary': config.inversePrimary,

    '--ds-secondary': config.secondary,
    '--ds-on-secondary': config.onSecondary,
    '--ds-secondary-container': config.secondaryContainer,
    '--ds-on-secondary-container': config.onSecondaryContainer,
    '--ds-secondary-fixed': config.secondaryFixed,
    '--ds-secondary-fixed-dim': config.secondaryFixedDim,

    '--ds-tertiary': config.tertiary,
    '--ds-on-tertiary': config.onTertiary,
    '--ds-tertiary-container': config.tertiaryContainer,
    '--ds-on-tertiary-container': config.onTertiaryContainer,

    '--ds-surface': config.surface,
    '--ds-surface-dim': config.surfaceDim,
    '--ds-surface-bright': config.surfaceBright,
    '--ds-surface-container-lowest': config.surfaceContainerLowest,
    '--ds-surface-container-low': config.surfaceContainerLow,
    '--ds-surface-container': config.surfaceContainer,
    '--ds-surface-container-high': config.surfaceContainerHigh,
    '--ds-surface-container-highest': config.surfaceContainerHighest,
    '--ds-surface-variant': config.surfaceVariant,
    '--ds-on-surface': config.onSurface,
    '--ds-on-surface-variant': config.onSurfaceVariant,
    '--ds-inverse-surface': config.inverseSurface,
    '--ds-inverse-on-surface': config.inverseOnSurface,

    '--ds-outline': config.outline,
    '--ds-outline-variant': config.outlineVariant,
    '--ds-background': config.background,
    '--ds-on-background': config.onBackground,
    
    '--ds-error': config.error,
    '--ds-on-error': config.onError,
    '--ds-error-container': config.errorContainer,
    '--ds-on-error-container': config.onErrorContainer,
    
    // Spacing
    '--ds-spacing-base': config.spacingBase,
    '--ds-spacing-xs': config.spacingXs,
    '--ds-spacing-sm': config.spacingSm,
    '--ds-spacing-md': config.spacingMd,
    '--ds-spacing-lg': config.spacingLg,
    '--ds-spacing-xl': config.spacingXl,
    '--ds-spacing-gutter': config.spacingGutter,

    // Radius
    '--ds-radius-sm': config.radiusSm,
    '--ds-radius-default': config.radiusDefault,
    '--ds-radius-md': config.radiusMd,
    '--ds-radius-lg': config.radiusLg,
    '--ds-radius-xl': config.radiusXl,
    '--ds-radius-full': config.radiusFull,
    
    // Shadows
    '--ds-shadow-sm': config.shadowSm,
    '--ds-shadow-md': config.shadowMd,
    '--ds-shadow-lg': config.shadowLg,
    '--ds-shadow-xl': config.shadowXl,

    // Interaction
    '--ds-hover-opacity': config.interactionHoverOpacity,
    '--ds-active-scale': config.interactionActiveScale,
    '--ds-transition-timing': config.interactionTransitionTiming,
    '--ds-transition-easing': config.interactionTransitionEasing,
    '--ds-focus-glow': config.interactionFocusGlow,
  } as React.CSSProperties;

  const fontFamilies = Array.from(new Set([
    config.typeDisplayXl.fontFamily,
    config.typeHeadlineLg.fontFamily,
    config.typeBodyLg.fontFamily,
    config.typeLabelSm.fontFamily
  ]));

  return (
    <div style={cssVars} className="w-full max-w-[1400px] mx-auto p-4 lg:p-8 animate-in fade-in duration-700 select-none">
      <GoogleFontLoader fonts={fontFamilies} />
      
      <div className="grid grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Section: Color Token Architecture */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="mb-8">
            <h3 className="text-white text-2xl font-black tracking-tighter mb-2">Token Architecture</h3>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Material 3 Design Specification</p>
          </div>

          {[
            { label: 'Primary', token: 'primary', hex: config.primary, on: config.onPrimary, container: config.primaryContainer },
            { label: 'Secondary', token: 'secondary', hex: config.secondary, on: config.onSecondary, container: config.secondaryContainer },
            { label: 'Tertiary', token: 'tertiary', hex: config.tertiary, on: config.onTertiary, container: config.tertiaryContainer },
            { label: 'Neutral', token: 'surface', hex: config.surface, on: config.onSurface, container: config.surfaceVariant },
          ].map((item) => (
            <div 
              key={item.label}
              className="bg-[var(--ds-surface-container)] border border-[var(--ds-outline-variant)] overflow-hidden shadow-md transition-all hover:scale-[1.01]"
              style={{ borderRadius: 'var(--ds-radius-md)' }}
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-[var(--ds-on-surface-variant)] font-bold uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-[var(--ds-on-surface)] font-black text-sm tracking-tight">{item.hex.toUpperCase()}</p>
                </div>
                <div className="flex gap-3">
                   <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: item.hex }} />
                   <div className="w-10 h-10 rounded-lg shadow-inner border border-[var(--ds-outline-variant)]" style={{ backgroundColor: item.container }} />
                </div>
              </div>
              
              <div className="flex h-6 w-full opacity-60">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100].map((tone) => (
                  <div 
                    key={tone}
                    className="flex-1"
                    style={{ 
                      backgroundColor: item.hex,
                      filter: `brightness(${tone / 60 + 0.4}) saturate(${tone > 50 ? 0.8 : 1.2})`
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Elevation Preview */}
          <div className="pt-4 space-y-4">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Elevation System</p>
             <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-[var(--ds-surface-container)] flex items-center justify-center border border-[var(--ds-outline-variant)] shadow-[var(--ds-shadow-sm)]" style={{ borderRadius: 'var(--ds-radius-sm)' }}>
                   <span className="text-[8px] font-black text-[var(--ds-on-surface-variant)]">SM</span>
                </div>
                <div className="aspect-square bg-[var(--ds-surface-container)] flex items-center justify-center border border-[var(--ds-outline-variant)] shadow-[var(--ds-shadow-md)]" style={{ borderRadius: 'var(--ds-radius-md)' }}>
                   <span className="text-[8px] font-black text-[var(--ds-on-surface-variant)]">MD</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Section: Deep Component Testing */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Typography Master Spec */}
            <div className="col-span-1 md:col-span-2 p-8 bg-[var(--ds-surface-container)] border border-[var(--ds-outline-variant)] shadow-[var(--ds-shadow-md)] overflow-hidden" style={{ borderRadius: 'var(--ds-radius-xl)' }}>
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[var(--ds-primary)] rounded-full" />
                    <p className="text-[10px] text-[var(--ds-on-surface)] font-black uppercase tracking-widest">Type System Engine</p>
                 </div>
                 <div className="flex gap-4">
                    <span className="text-[9px] font-mono text-[var(--ds-on-surface-variant)]">{config.typeDisplayXl.fontFamily}</span>
                    <span className="text-[9px] font-mono text-[var(--ds-on-surface-variant)]">{config.typeBodyLg.fontFamily}</span>
                 </div>
              </div>
              
              <div className="space-y-12">
                <div className="flex items-start gap-10">
                   <div 
                     className="text-9xl font-black leading-none tracking-tighter select-none" 
                     style={{ 
                       fontFamily: config.typeDisplayXl.fontFamily, 
                       color: 'var(--ds-primary)',
                       fontWeight: config.typeDisplayXl.fontWeight,
                       letterSpacing: config.typeDisplayXl.letterSpacing
                     }}
                   >Aa</div>
                   <div className="space-y-6 flex-1 pt-4">
                      <h1 
                        className="tracking-tight" 
                        style={{ 
                          fontFamily: config.typeDisplayXl.fontFamily, 
                          color: 'var(--ds-on-surface)',
                          fontSize: config.typeDisplayXl.fontSize,
                          fontWeight: config.typeDisplayXl.fontWeight,
                          lineHeight: config.typeDisplayXl.lineHeight
                        }}
                      >Future Foundry</h1>
                      <p 
                        style={{ 
                          fontFamily: config.typeBodyLg.fontFamily, 
                          color: 'var(--ds-on-surface-variant)',
                          fontSize: config.typeBodyLg.fontSize,
                          fontWeight: config.typeBodyLg.fontWeight,
                          lineHeight: config.typeBodyLg.lineHeight,
                          letterSpacing: config.typeBodyLg.letterSpacing
                        }}
                      >A modular design system built for the next generation of intelligent interfaces. Engineered with precision, refined through motion.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-[var(--ds-outline-variant)] pt-10">
                   {[
                     { label: 'Headline LG', val: config.typeHeadlineLg },
                     { label: 'Headline MD', val: config.typeHeadlineMd },
                     { label: 'Body MD', val: config.typeBodyMd },
                     { label: 'Label SM', val: config.typeLabelSm }
                   ].map(item => (
                     <div key={item.label} className="space-y-2">
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                        <p 
                          className="truncate"
                          style={{ 
                            fontFamily: item.val.fontFamily, 
                            fontSize: item.val.fontSize, 
                            fontWeight: item.val.fontWeight,
                            color: 'var(--ds-on-surface)' 
                          }}
                        >The quick brown fox</p>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Interaction & State Testing */}
            <div className="p-8 bg-[var(--ds-surface-container)] border border-[var(--ds-outline-variant)] shadow-[var(--ds-shadow-md)] space-y-8" style={{ borderRadius: 'var(--ds-radius-xl)' }}>
               <div className="flex items-center gap-3">
                  <MousePointer2 size={16} className="text-[var(--ds-primary)]" />
                  <p className="text-[10px] text-[var(--ds-on-surface)] font-black uppercase tracking-widest">Interaction States</p>
               </div>
               
               <div className="space-y-4">
                  <button 
                    className="w-full py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-[var(--ds-active-scale)] shadow-[var(--ds-shadow-md)] flex items-center justify-center gap-2 group" 
                    style={{ 
                      backgroundColor: 'var(--ds-primary)', 
                      color: 'var(--ds-on-primary)',
                      borderRadius: 'var(--ds-radius-md)',
                      transitionDuration: 'var(--ds-transition-timing)',
                      transitionTimingFunction: 'var(--ds-transition-easing)'
                    }}
                  >
                    <span>Primary Action</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    className="w-full py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-[var(--ds-active-scale)] flex items-center justify-center gap-2 group border-2" 
                    style={{ 
                      borderColor: 'var(--ds-outline)', 
                      color: 'var(--ds-on-surface)',
                      borderRadius: 'var(--ds-radius-md)',
                      transitionDuration: 'var(--ds-transition-timing)',
                      transitionTimingFunction: 'var(--ds-transition-easing)'
                    }}
                  >
                    Ghost Variant
                  </button>

                  <div className="pt-4 space-y-4">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Focus & Selection</p>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 bg-[var(--ds-primary-container)] border-2 border-[var(--ds-primary)] flex items-center justify-center" style={{ borderRadius: 'var(--ds-radius-sm)' }}>
                          <Check size={16} className="text-[var(--ds-on-primary-container)]" />
                       </div>
                       <div className="flex-1 bg-white/5 border-2 border-transparent p-2 transition-all" style={{ boxShadow: 'var(--ds-focus-glow)', borderRadius: 'var(--ds-radius-sm)' }}>
                          <div className="h-4 w-full bg-[var(--ds-primary)]/20 rounded-sm" />
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Dashboard Mock Component */}
            <div className="p-8 bg-[var(--ds-surface-container)] border border-[var(--ds-outline-variant)] shadow-[var(--ds-shadow-md)] flex flex-col gap-6" style={{ borderRadius: 'var(--ds-radius-xl)' }}>
               <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[var(--ds-secondary-container)] flex items-center justify-center">
                     <User size={18} className="text-[var(--ds-on-secondary-container)]" />
                  </div>
                  <div className="flex gap-1">
                     {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--ds-outline-variant)]" />)}
                  </div>
               </div>
               
               <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-[var(--ds-on-surface)]/10 rounded-full" />
                  <div className="h-4 w-1/2 bg-[var(--ds-on-surface)]/5 rounded-full" />
               </div>

               <div className="mt-auto pt-6 border-t border-[var(--ds-outline-variant)] flex items-center justify-between">
                  <div className="flex gap-2">
                     <div className="w-8 h-8 rounded-lg bg-[var(--ds-surface-variant)] flex items-center justify-center border border-[var(--ds-outline-variant)]">
                        <Settings size={14} className="text-[var(--ds-on-surface-variant)]" />
                     </div>
                     <div className="w-8 h-8 rounded-lg bg-[var(--ds-surface-variant)] flex items-center justify-center border border-[var(--ds-outline-variant)]">
                        <Bell size={14} className="text-[var(--ds-on-surface-variant)]" />
                     </div>
                  </div>
                  <div className="px-4 py-2 bg-[var(--ds-tertiary-container)] text-[var(--ds-on-tertiary-container)] text-[10px] font-black uppercase rounded-full border border-[var(--ds-on-tertiary-container)]/10">
                     Active Mode
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
