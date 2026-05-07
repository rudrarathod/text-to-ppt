import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { SlideStatic } from "../components/SlidePreview";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutTemplate, MousePointer2, Maximize, RotateCcw } from "lucide-react";
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

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    navigate(-1);
  };

  useEffect(() => {
    // Cleanup fullscreen on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    };
  }, []);

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
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, navigate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    let lastScrollTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < 500) return; // 500ms cooldown

      if (e.deltaY > 0) {
        setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
        lastScrollTime = now;
      } else if (e.deltaY < 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
        lastScrollTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [slides.length]);

  // Touch gestures for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Laser pointer for touch
    if (isLaserEnabled) {
      setMousePos({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
      setShowControls(false);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
    } else if (isRightSwipe) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  };

  const [tapTimeout, setTapTimeout] = useState<any>(null);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (tapTimeout) clearTimeout(tapTimeout);
      if (!showControls) setShowControls(true);
      setLastTapTime(0);
    } else {
      setLastTapTime(now);
      const timeout = setTimeout(() => {
         if (showControls) setShowControls(false);
      }, DOUBLE_TAP_DELAY);
      setTapTimeout(timeout);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleOrientation = () => {
    if (screen.orientation && screen.orientation.lock) {
      if (window.innerWidth < window.innerHeight) {
        screen.orientation.lock('landscape').catch(e => console.log(e));
      } else {
        screen.orientation.unlock();
      }
    } else {
      alert("Please rotate your device for the best experience.");
    }
  };

  if (!presentation) {
    return (
      <div className="h-screen w-full bg-[#111111] flex flex-col items-center justify-center text-white p-6 text-center">
         <LayoutTemplate size={48} className="text-white mb-4 opacity-50" />
         <h1 className="text-2xl font-bold mb-2">Presentation Not Found</h1>
         <p className="text-gray-400 mb-6">The presentation you're looking for doesn't exist or has been removed.</p>
         <button onClick={() => navigate("/")} className="px-6 py-2 bg-white text-black rounded-xl font-bold">Back to Gallery</button>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black z-[2000] overflow-hidden select-none transition-all duration-300 touch-none",
        (isLaserEnabled || !showControls) ? "cursor-none" : "cursor-default"
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleTap}
    >
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
        className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
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
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-6 px-5 md:px-8 py-3 md:py-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full transition-all duration-500 z-50 max-w-[95vw] md:max-w-none",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
         <button 
           onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
           disabled={currentIndex === 0}
           className="p-1 md:p-2 text-white/50 hover:text-white disabled:opacity-10 transition-colors"
         >
           <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
         </button>
         
         <div className="flex flex-col items-center min-w-[50px] md:min-w-[120px]">
            <span className="text-[7px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-0.5 md:mb-1">Slide</span>
            <span className="text-xs md:text-xl font-black text-white tabular-nums">
              {currentIndex + 1} <span className="text-white/20 mx-0.5 md:mx-1">/</span> {slides.length}
            </span>
         </div>

         <button 
           onClick={() => setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1))}
           disabled={currentIndex === slides.length - 1}
           className="p-1 md:p-2 text-white/50 hover:text-white disabled:opacity-10 transition-colors"
         >
           <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
         </button>

         <div className="w-px h-6 md:h-10 bg-white/10 mx-0.5 md:mx-2" />

         <div className="flex items-center gap-1 md:gap-2">
           <button 
             onClick={() => setIsLaserEnabled(!isLaserEnabled)}
             className={cn(
               "p-1.5 md:p-2 transition-all rounded-lg",
               isLaserEnabled ? "bg-white text-black" : "text-white/50 hover:text-white bg-white/5"
             )}
             title="Laser Pointer"
           >
             <MousePointer2 size={window.innerWidth < 768 ? 16 : 22} />
           </button>

           <button 
             onClick={toggleFullScreen}
             className="p-1.5 md:p-2 transition-all rounded-lg text-white/50 hover:text-white bg-white/5"
             title="Full Screen"
           >
             <Maximize size={window.innerWidth < 768 ? 16 : 22} />
           </button>

           <button 
             onClick={toggleOrientation}
             className="p-1.5 md:p-2 transition-all rounded-lg text-white/50 hover:text-white bg-white/5"
             title="Rotate Orientation"
           >
             <RotateCcw size={window.innerWidth < 768 ? 16 : 22} />
           </button>
         </div>

         <div className="w-px h-6 md:h-10 bg-white/10 mx-0.5 md:mx-2" />

         <button 
           onClick={handleExit}
           className="p-1 md:p-2 text-white/50 hover:text-white transition-all"
           title="Exit"
         >
           <X className="w-6 h-6 md:w-10 md:h-10" />
         </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-white/5 z-50">
         <div 
           className="h-full transition-all duration-500 ease-out"
           style={{ 
             width: `${((currentIndex + 1) / slides.length) * 100}%`,
             backgroundColor: designConfig.primary,
             boxShadow: `0 0 10px ${designConfig.primary}40`
           }}
         />
      </div>

      {/* Slide Navigation Hints - Hidden on Mobile to avoid clutter since we have swipes */}
      <div className={cn(
        "hidden md:flex fixed inset-y-0 left-0 w-32 bg-gradient-to-r from-black/40 to-transparent items-center justify-start pl-8 transition-opacity duration-500 pointer-events-none",
        showControls && currentIndex > 0 ? "opacity-100" : "opacity-0"
      )}>
        <ChevronLeft size={48} className="text-white/20" />
      </div>
      <div className={cn(
        "hidden md:flex fixed inset-y-0 right-0 w-32 bg-gradient-to-l from-black/40 to-transparent items-center justify-end pr-8 transition-opacity duration-500 pointer-events-none",
        showControls && currentIndex < slides.length - 1 ? "opacity-100" : "opacity-0"
      )}>
        <ChevronRight size={48} className="text-white/20" />
      </div>
    </div>
  );
}
