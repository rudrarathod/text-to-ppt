import React, { useRef, useState, useEffect } from 'react';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

interface ThemePreviewCanvasProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A 16:9 canvas container that renders children at a fixed 1920×1080
 * reference resolution and uses CSS transform scaling to fit any container.
 * This guarantees pixel-perfect, consistent rendering across all screen sizes.
 */
export const ThemePreviewCanvas: React.FC<ThemePreviewCanvasProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(CANVAS_H);

  useEffect(() => {
    const el = containerRef.current;
    const contentEl = contentRef.current;
    if (!el || !contentEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          setScale(entry.contentRect.width / CANVAS_W);
        } else if (entry.target === contentEl) {
          setContentHeight(entry.contentRect.height);
        }
      }
    });

    observer.observe(el);
    observer.observe(contentEl);
    
    setScale(el.clientWidth / CANVAS_W);
    setContentHeight(contentEl.clientHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        borderRadius: '12px',
        background: '#0a0a0c',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: CANVAS_W,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
      {/* Spacer to ensure the container height matches the scaled content height */}
      <div style={{ height: contentHeight * scale, pointerEvents: 'none' }} />
    </div>
  );
};
