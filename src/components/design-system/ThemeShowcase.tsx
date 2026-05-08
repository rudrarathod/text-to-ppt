import React from 'react';
import { ChevronRight, User, Settings, Bell, MousePointer2, Check, Palette } from 'lucide-react';
import { GoogleFontLoader } from '../../lib/typography';
import { DesignConfig } from '../../store';

interface ThemeShowcaseProps {
  config: DesignConfig;
}

/**
 * ThemeShowcase — renders at a fixed 1920×1080 reference resolution.
 * Must be placed inside a ThemePreviewCanvas for proper scaling.
 * All dimensions are fixed px values for pixel-perfect consistency.
 */
export const ThemeShowcase: React.FC<ThemeShowcaseProps> = ({ config }) => {
  const cssVars = {
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
    '--ds-spacing-base': config.spacingBase,
    '--ds-spacing-xs': config.spacingXs,
    '--ds-spacing-sm': config.spacingSm,
    '--ds-spacing-md': config.spacingMd,
    '--ds-spacing-lg': config.spacingLg,
    '--ds-spacing-xl': config.spacingXl,
    '--ds-spacing-gutter': config.spacingGutter,
    '--ds-radius-sm': config.radiusSm,
    '--ds-radius-default': config.radiusDefault,
    '--ds-radius-md': config.radiusMd,
    '--ds-radius-lg': config.radiusLg,
    '--ds-radius-xl': config.radiusXl,
    '--ds-radius-full': config.radiusFull,
    '--ds-shadow-sm': config.shadowSm,
    '--ds-shadow-md': config.shadowMd,
    '--ds-shadow-lg': config.shadowLg,
    '--ds-shadow-xl': config.shadowXl,
    '--ds-hover-opacity': config.interactionHoverOpacity,
    '--ds-active-scale': config.interactionActiveScale,
    '--ds-transition-timing': config.interactionTransitionTiming,
    '--ds-transition-easing': config.interactionTransitionEasing,
    '--ds-focus-glow': config.interactionFocusGlow,
  } as React.CSSProperties;

  const fontFamilies = Array.from(new Set([
    config.typeDisplayXl?.fontFamily || config.headingFont || 'Inter',
    config.typeHeadlineLg?.fontFamily || config.headingFont || 'Inter',
    config.typeBodyLg?.fontFamily || config.fontFamily || 'Inter',
    config.typeLabelSm?.fontFamily || config.fontFamily || 'Inter'
  ])).filter(Boolean);

  const colorTokens = [
    { label: 'Primary', hex: config.primary, on: config.onPrimary, container: config.primaryContainer },
    { label: 'Secondary', hex: config.secondary, on: config.onSecondary, container: config.secondaryContainer },
    { label: 'Tertiary', hex: config.tertiary, on: config.onTertiary, container: config.tertiaryContainer },
    { label: 'Neutral', hex: config.surface, on: config.onSurface, container: config.surfaceVariant },
  ];

  const defaultType = { fontFamily: config.fontFamily || 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', letterSpacing: '0px' };
  const typeSpecs = [
    { label: 'Headline LG', val: config.typeHeadlineLg || { ...defaultType, fontFamily: config.headingFont || 'Inter', fontSize: '32px', fontWeight: '700' } },
    { label: 'Headline MD', val: config.typeHeadlineMd || { ...defaultType, fontFamily: config.headingFont || 'Inter', fontSize: '28px', fontWeight: '600' } },
    { label: 'Body MD', val: config.typeBodyMd || defaultType },
  ];

  return (
    <div
      style={{
        ...cssVars,
        width: 1920,
        minHeight: 1080,
        background: 'var(--ds-background)',
        display: 'flex',
        padding: 64,
        gap: 64,
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        color: 'var(--ds-on-background)',
      }}
    >
      <GoogleFontLoader fonts={fontFamilies} />

      {/* ── Left Column: Token Architecture (440px) ── */}
      <div style={{ width: 440, display: 'flex', flexDirection: 'column', gap: 32, flexShrink: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
             <div style={{ width: 48, height: 48, background: 'var(--ds-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--ds-shadow-lg)' }}>
                <Palette size={24} style={{ color: 'var(--ds-on-primary)' }} />
             </div>
             <div>
                <h3 style={{ color: 'var(--ds-on-surface)', fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>
                  Design DNA
                </h3>
                <p style={{ color: 'var(--ds-on-surface-variant)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4, opacity: 0.7 }}>
                  M3 Specification v2.4
                </p>
             </div>
          </div>
        </div>

        {/* Color Token Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {colorTokens.map((item) => (
            <div
              key={item.label}
              style={{
                background: 'var(--ds-surface-container-high)',
                border: '1px solid var(--ds-outline-variant)',
                borderRadius: 'var(--ds-radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--ds-shadow-md)',
              }}
            >
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--ds-on-surface-variant)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                    {item.label}
                  </p>
                  <p style={{ color: 'var(--ds-on-surface)', fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em' }}>
                    {item.hex.toUpperCase()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: item.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }} />
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: item.container, border: '1px solid var(--ds-outline-variant)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', height: 24, width: '100%', opacity: 0.8 }}>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100].map((tone) => (
                  <div
                    key={tone}
                    style={{
                      flex: 1,
                      backgroundColor: item.hex,
                      filter: `brightness(${tone / 60 + 0.4}) saturate(${tone > 50 ? 0.8 : 1.2})`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Elevation Preview */}
        <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid var(--ds-outline-variant)' }}>
          <p style={{ color: 'var(--ds-on-surface-variant)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 24 }}>
            Elevation System
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { l: 'SM', s: 'var(--ds-shadow-sm)', r: 'var(--ds-radius-sm)' },
              { l: 'MD', s: 'var(--ds-shadow-md)', r: 'var(--ds-radius-md)' },
              { l: 'LG', s: 'var(--ds-shadow-lg)', r: 'var(--ds-radius-lg)' }
            ].map(elev => (
              <div
                key={elev.l}
                style={{
                  aspectRatio: '1',
                  background: 'var(--ds-surface-container-highest)',
                  border: '1px solid var(--ds-outline-variant)',
                  borderRadius: elev.r,
                  boxShadow: elev.s,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--ds-on-surface)' }}>{elev.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Column: Component Gallery (Flexible) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 48, minWidth: 0 }}>

        {/* Typography Showcase */}
        <div
          style={{
            background: 'var(--ds-surface-container-low)',
            border: '1px solid var(--ds-outline-variant)',
            borderRadius: 32,
            boxShadow: 'var(--ds-shadow-lg)',
            padding: 56,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Background Mark */}
          <div style={{ position: 'absolute', top: -100, right: -50, fontSize: 400, fontWeight: 900, color: 'var(--ds-on-surface)', opacity: 0.03, pointerEvents: 'none', fontFamily: config.typeDisplayXl?.fontFamily || config.headingFont || 'Inter' }}>
            Aa
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 8, height: 32, background: 'var(--ds-primary)', borderRadius: 999 }} />
              <p style={{ fontSize: 14, color: 'var(--ds-on-surface)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Typographic Engine
              </p>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ds-on-surface-variant)', background: 'var(--ds-surface-variant)', padding: '6px 16px', borderRadius: 999 }}>{config.typeDisplayXl?.fontFamily || config.headingFont || 'Inter'}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ds-on-surface-variant)', background: 'var(--ds-surface-variant)', padding: '6px 16px', borderRadius: 999 }}>{config.typeBodyLg?.fontFamily || config.fontFamily || 'Inter'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 64, position: 'relative' }}>
            <div
              style={{
                fontSize: 180,
                fontFamily: config.typeDisplayXl?.fontFamily || config.headingFont || 'Inter',
                color: 'var(--ds-primary)',
                fontWeight: config.typeDisplayXl?.fontWeight || '700',
                letterSpacing: config.typeDisplayXl?.letterSpacing || '-0.25px',
                lineHeight: 0.8,
                userSelect: 'none',
              }}
            >
              Aa
            </div>
            <div style={{ flex: 1, paddingTop: 16 }}>
              <h1
                style={{
                  fontFamily: config.typeDisplayXl?.fontFamily || config.headingFont || 'Inter',
                  color: 'var(--ds-on-surface)',
                  fontSize: 84,
                  fontWeight: config.typeDisplayXl?.fontWeight || '700',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  margin: '0 0 24px 0',
                }}
              >
                Modern Foundry
              </h1>
              <p
                style={{
                  fontFamily: config.typeBodyLg?.fontFamily || config.fontFamily || 'Inter',
                  color: 'var(--ds-on-surface-variant)',
                  fontSize: 24,
                  fontWeight: config.typeBodyLg?.fontWeight || '400',
                  lineHeight: 1.5,
                  letterSpacing: config.typeBodyLg?.letterSpacing || '0.5px',
                  margin: 0,
                  maxWidth: 800,
                }}
              >
                A high-fidelity design ecosystem engineered for precision and scale. Every token is meticulously crafted to ensure seamless visual harmony across all intelligent interfaces.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 40,
              borderTop: '1px solid var(--ds-outline-variant)',
              paddingTop: 48,
              marginTop: 56,
              position: 'relative'
            }}
          >
            {typeSpecs.map((item) => (
              <div key={item.label}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ds-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: item.val?.fontFamily || 'Inter',
                    fontSize: 22,
                    fontWeight: item.val?.fontWeight || '400',
                    color: 'var(--ds-on-surface)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Visual Precision
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Interactive System & Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 48, flex: 1, minHeight: 0 }}>

          {/* Interaction Lab */}
          <div
            style={{
              background: 'var(--ds-surface-container-high)',
              border: '1px solid var(--ds-outline-variant)',
              borderRadius: 32,
              boxShadow: 'var(--ds-shadow-lg)',
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MousePointer2 size={24} style={{ color: 'var(--ds-primary)' }} />
              <p style={{ fontSize: 14, color: 'var(--ds-on-surface)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
                Interaction Lab
              </p>
            </div>

            <button
              style={{
                width: '100%',
                padding: '24px 0',
                fontSize: 14,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                backgroundColor: 'var(--ds-primary)',
                color: 'var(--ds-on-primary)',
                borderRadius: 'var(--ds-radius-lg)',
                border: 'none',
                boxShadow: 'var(--ds-shadow-xl)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span>Execute Action</span>
              <ChevronRight size={18} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <button
                 style={{
                   padding: '18px 0',
                   fontSize: 12,
                   fontWeight: 900,
                   textTransform: 'uppercase',
                   letterSpacing: '0.15em',
                   borderColor: 'var(--ds-outline)',
                   color: 'var(--ds-on-surface)',
                   borderRadius: 'var(--ds-radius-md)',
                   border: '2px solid var(--ds-outline)',
                   background: 'transparent',
                   cursor: 'pointer',
                 }}
               >
                 Outline
               </button>
               <button
                 style={{
                   padding: '18px 0',
                   fontSize: 12,
                   fontWeight: 900,
                   textTransform: 'uppercase',
                   letterSpacing: '0.15em',
                   background: 'var(--ds-secondary-container)',
                   color: 'var(--ds-on-secondary-container)',
                   borderRadius: 'var(--ds-radius-md)',
                   border: 'none',
                   cursor: 'pointer',
                 }}
               >
                 Secondary
               </button>
            </div>

            <div style={{ paddingTop: 16 }}>
              <p style={{ fontSize: 11, color: 'var(--ds-on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
                System Feedback
              </p>
              <div style={{ display: 'flex', gap: 20 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: 'var(--ds-primary-container)',
                    border: '3px solid var(--ds-primary)',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--ds-shadow-md)'
                  }}
                >
                  <Check size={32} style={{ color: 'var(--ds-on-primary-container)' }} />
                </div>
                <div
                  style={{
                    flex: 1,
                    background: 'var(--ds-surface-variant)',
                    border: '1px solid var(--ds-outline-variant)',
                    borderRadius: 16,
                    boxShadow: 'var(--ds-focus-glow)',
                    padding: 12,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ height: 24, width: '100%', background: 'var(--ds-primary)', opacity: 0.3, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          </div>

          {/* System Dashboard */}
          <div
            style={{
              background: 'var(--ds-surface-container-highest)',
              border: '1px solid var(--ds-outline-variant)',
              borderRadius: 32,
              boxShadow: 'var(--ds-shadow-xl)',
              padding: 48,
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 24,
                    background: 'var(--ds-secondary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--ds-shadow-md)'
                  }}
                >
                  <User size={36} style={{ color: 'var(--ds-on-secondary-container)' }} />
                </div>
                <div>
                   <div style={{ height: 20, width: 240, background: 'var(--ds-on-surface)', opacity: 0.15, borderRadius: 999, marginBottom: 12 }} />
                   <div style={{ height: 16, width: 140, background: 'var(--ds-on-surface)', opacity: 0.08, borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ds-outline-variant)' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
               <div style={{ padding: 24, borderRadius: 20, background: 'var(--ds-surface-container-low)', border: '1px solid var(--ds-outline-variant)' }}>
                  <div style={{ height: 12, width: 60, background: 'var(--ds-primary)', opacity: 0.4, borderRadius: 999, marginBottom: 16 }} />
                  <div style={{ height: 32, width: '100%', background: 'var(--ds-on-surface)', opacity: 0.1, borderRadius: 8 }} />
               </div>
               <div style={{ padding: 24, borderRadius: 20, background: 'var(--ds-surface-container-low)', border: '1px solid var(--ds-outline-variant)' }}>
                  <div style={{ height: 12, width: 60, background: 'var(--ds-tertiary)', opacity: 0.4, borderRadius: 999, marginBottom: 16 }} />
                  <div style={{ height: 32, width: '100%', background: 'var(--ds-on-surface)', opacity: 0.1, borderRadius: 8 }} />
               </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 32,
                borderTop: '1px solid var(--ds-outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'var(--ds-surface-variant)',
                    border: '1px solid var(--ds-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Settings size={24} style={{ color: 'var(--ds-on-surface-variant)' }} />
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'var(--ds-surface-variant)',
                    border: '1px solid var(--ds-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Bell size={24} style={{ color: 'var(--ds-on-surface-variant)' }} />
                </div>
              </div>
              <div
                style={{
                  padding: '12px 28px',
                  background: 'var(--ds-tertiary-container)',
                  color: 'var(--ds-on-tertiary-container)',
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  borderRadius: 999,
                  border: '2px solid var(--ds-on-tertiary-container)',
                  boxShadow: 'var(--ds-shadow-lg)'
                }}
              >
                PRO MODE ACTIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
