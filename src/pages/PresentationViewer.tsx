import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { SlideStatic } from "../components/SlidePreview";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutTemplate, MousePointer2 } from "lucide-react";
import { cn } from "../lib/utils";

export function PresentationViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { presentations, templates } = useAppStore();
  const presentation = presentations.find(p => p.id === id);
  const slides = presentation?.slides || [];
  const template = templates.find(t => t.id === presentation?.templateId) || templates[0];
  const layouts = template.layouts;
  const designConfig = template.designConfig;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLaserEnabled, setIsLaserEnabled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scaleW = width / 1280;
      const scaleH = height / 720;
      setScale(Math.min(scaleW, scaleH));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, navigate]);

  useEffect(() => {
    let timeout: any;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setShowControls(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!presentation) {
    return (
      <div className="h-screen w-full bg-[#111111] flex flex-col items-center justify-center text-white p-6 text-center">
         <LayoutTemplate size={48} className="text-[#D62828] mb-4 opacity-50" />
         <h1 className="text-2xl font-bold mb-2">Presentation Not Found</h1>
         <p className="text-gray-400 mb-6">The presentation you're looking for doesn't exist or has been removed.</p>
         <button onClick={() => navigate("/")} className="px-6 py-2 bg-[#D62828] rounded-xl font-bold">Back to Gallery</button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-black z-[2000] overflow-hidden select-none transition-all duration-300",
      (isLaserEnabled || !showControls) ? "cursor-none" : "cursor-default"
    )}>
      {isLaserEnabled && (
        <div 
          className="fixed w-4 h-4 bg-red-500 rounded-full pointer-events-none z-[3000] shadow-[0_0_20px_#ef4444,0_0_40px_#ef4444]"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.05s linear, top 0.05s linear'
          }}
        >
          <div className="absolute inset-0 bg-white/40 rounded-full scale-50" />
        </div>
      )}
      <div 
        className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        style={{ 
          width: 1280, 
          height: 720, 
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {slides.length > 0 && (
          <SlideStatic 
            templateCode={layouts.find(l => l.id === slides[currentIndex].layoutId)?.code || layouts[0].code}
            data={slides[currentIndex].content}
            designConfig={designConfig}
          />
        )}
      </div>

      {/* Controls Overlay */}
      <div className={cn(
        "absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 z-50",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
         <button 
           onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
           disabled={currentIndex === 0}
           className="p-2 text-white/50 hover:text-white disabled:opacity-10 transition-colors"
         >
           <ChevronLeft size={32} />
         </button>
         
         <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] font-black text-[#D62828] uppercase tracking-[0.3em] mb-1">Slide</span>
            <span className="text-xl font-black text-white tabular-nums">{currentIndex + 1} <span className="text-white/20 mx-1">/</span> {slides.length}</span>
         </div>

         <button 
           onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
           disabled={currentIndex === slides.length - 1}
           className="p-2 text-white/50 hover:text-white disabled:opacity-10 transition-colors"
         >
           <ChevronRight size={32} />
         </button>

         <div className="w-px h-10 bg-white/10 mx-2" />

         <button 
           onClick={() => setIsLaserEnabled(!isLaserEnabled)}
           className={cn(
             "p-2 transition-all rounded-full",
             isLaserEnabled ? "bg-[#D62828] text-white shadow-[0_0_15px_rgba(214,40,40,0.5)]" : "text-white/50 hover:text-white"
           )}
           title={isLaserEnabled ? "Disable Laser Pointer" : "Enable Laser Pointer"}
         >
           <MousePointer2 size={24} />
         </button>

         <div className="w-px h-10 bg-white/10 mx-2" />

         <button 
           onClick={() => navigate(-1)}
           className="p-2 text-white/50 hover:text-[#D62828] transition-all hover:scale-110 active:scale-95"
           title="Exit Presentation"
         >
           <X size={32} />
         </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 z-50">
         <div 
           className="h-full bg-gradient-to-r from-[#D62828] to-[#fe6247] transition-all duration-500 ease-out shadow-[0_0_20px_rgba(214,40,40,0.6)]"
           style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
         />
      </div>

      {/* Slide Navigation Hints */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-32 bg-gradient-to-r from-black/40 to-transparent flex items-center justify-start pl-8 transition-opacity duration-500 pointer-events-none",
        showControls && currentIndex > 0 ? "opacity-100" : "opacity-0"
      )}>
        <ChevronLeft size={48} className="text-white/20" />
      </div>
      <div className={cn(
        "fixed inset-y-0 right-0 w-32 bg-gradient-to-l from-black/40 to-transparent flex items-center justify-end pr-8 transition-opacity duration-500 pointer-events-none",
        showControls && currentIndex < slides.length - 1 ? "opacity-100" : "opacity-0"
      )}>
        <ChevronRight size={48} className="text-white/20" />
      </div>
    </div>
  );
}
