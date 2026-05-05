import { Link, useLocation } from "react-router-dom";
import { Presentation, Code2, Pin, PinOff } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";

export function Navigation() {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("sidebar-pinned") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-pinned", String(isExpanded));
  }, [isExpanded]);

  return (
    <div 
      className={cn(
        "bg-[#161618] border-[#2d2d30] transition-all duration-300 relative z-50",
        "flex md:flex-col shrink-0 text-[#85858b]",
        "flex-row w-full h-16 border-t order-last md:order-none md:border-r md:border-t-0 md:h-full md:py-6",
        isExpanded ? "md:w-64 md:px-4 md:items-stretch" : "md:w-20 md:px-0 md:items-center",
        "items-center px-4"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-10 shrink-0 overflow-hidden shadow-sm transition-all rounded-xl items-center",
        "hidden md:flex mb-10",
        isExpanded ? "w-full justify-between px-4 bg-[#2d2d30]" : "w-10 justify-center bg-transparent"
      )}>
        <div className={cn("items-center gap-3", !isExpanded ? "hidden" : "flex")}>
           <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-[#FF6347] to-[#D62828] leading-none select-none transition-all text-xl">
             PitchGen
           </span>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn("text-[#85858b] hover:text-white transition-colors p-2 rounded-xl hover:bg-[#3d3d40] flex items-center justify-center")}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <PinOff size={16} /> : <div className="w-10 h-10 -m-2 bg-[#2d2d30] rounded-xl flex items-center justify-center font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-[#FF6347] to-[#D62828] text-2xl select-none">P</div>}
        </button>
      </div>

      <div className="md:hidden flex items-center shrink-0 mr-4">
        <span className="font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-[#FF6347] to-[#D62828] leading-none select-none text-xl">
          P
        </span>
      </div>
      
      <nav className="flex flex-1 md:flex-col flex-row gap-2 md:gap-4 w-full justify-center md:justify-start">
        <Link 
          to="/" 
          className={cn(
            "flex items-center gap-3 rounded-xl font-bold transition-all relative group",
            isExpanded ? "md:px-4 md:py-3" : "py-2 px-3 md:py-3 md:mx-2 md:flex-col text-[10px] gap-1.5",
            (location.pathname === "/" || location.pathname.startsWith("/presentations"))
              ? "bg-[#2d2d30] text-white" 
              : "hover:bg-[#2d2d30]/50 hover:text-white"
          )}
        >
          <Presentation size={24} strokeWidth={(location.pathname === "/" || location.pathname.startsWith("/presentations")) ? 2.5 : 2} />
          {isExpanded ? (
            <span className="leading-tight text-sm whitespace-nowrap hidden md:inline">Presentations</span>
          ) : (
            <span className="text-center w-full leading-tight hidden md:inline">Decks</span>
          )}
          {(location.pathname === "/" || location.pathname.startsWith("/presentations")) && (
            <div className={cn(
              "absolute bg-[#D62828] transition-all", 
              "md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-8 md:rounded-r-lg",
              "bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-t-lg md:bottom-auto md:left-0 md:translate-x-0"
            )} />
          )}
        </Link>
        <Link 
          to="/templates" 
          className={cn(
            "flex items-center gap-3 rounded-xl font-bold transition-all relative group",
            isExpanded ? "md:px-4 md:py-3" : "py-2 px-3 md:py-3 md:mx-2 md:flex-col text-[10px] gap-1.5",
            location.pathname.startsWith("/templates") 
              ? "bg-[#2d2d30] text-white" 
              : "hover:bg-[#2d2d30]/50 hover:text-white"
          )}
        >
          <Code2 size={24} strokeWidth={location.pathname.startsWith("/templates") ? 2.5 : 2} />
          {isExpanded ? (
            <span className="leading-tight text-sm whitespace-nowrap hidden md:inline">Template Gallery</span>
          ) : (
            <span className="text-center w-full leading-tight hidden md:inline">Gallery</span>
          )}
          {location.pathname.startsWith("/templates") && (
            <div className={cn(
              "absolute bg-[#D62828] transition-all", 
              "md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-8 md:rounded-r-lg",
              "bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-t-lg md:bottom-auto md:left-0 md:translate-x-0"
            )} />
          )}
        </Link>
      </nav>

      {/* User profile icon */}
      <div className={cn(
        "flex transition-all items-center ml-auto md:ml-0 md:mt-auto pt-0 md:pt-4", 
        isExpanded ? "md:w-full md:gap-3" : "md:justify-center"
      )}>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#FF6347] to-[#D62828] flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_10px_rgba(214,40,40,0.3)] select-none shrink-0">
          U
        </div>
        {isExpanded && (
          <div className="overflow-hidden flex-col justify-center hidden md:flex">
             <p className="text-white text-sm font-bold font-display truncate leading-tight">User Account</p>
             <p className="text-[10px] text-[#85858b] truncate leading-tight">rudrarathod738@gmail.com</p>
          </div>
        )}
      </div>
    </div>
  );
}
