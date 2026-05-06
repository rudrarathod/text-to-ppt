import { Link, useLocation } from "react-router-dom";
import { Presentation, LayoutTemplate, Settings, User, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
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

  const navItems = [
    { 
      label: "Presentations", 
      icon: Presentation, 
      path: "/", 
      match: (p: string) => p === "/" || p.startsWith("/presentations") 
    },
    { 
      label: "Design Library", 
      icon: LayoutTemplate, 
      path: "/templates", 
      match: (p: string) => p.startsWith("/templates") 
    }
  ];

  return (
    <div 
      className={cn(
        "bg-[#0f0f10] border-white/5 transition-all duration-500 ease-in-out relative z-50 flex flex-col shrink-0",
        "border-r",
        isExpanded ? "w-64" : "w-20",
        "h-full py-6 px-4"
      )}
    >
      {/* Brand Logo */}
      <div className={cn(
        "flex items-center gap-3 px-2 mb-10 transition-all duration-500",
        !isExpanded && "justify-center"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6347] to-[#D62828] flex items-center justify-center shadow-lg shadow-[#D62828]/20 shrink-0">
          <span className="text-white font-black text-xl select-none">P</span>
        </div>
        {isExpanded && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
            <span className="font-black text-white text-lg tracking-tighter leading-none">PitchGen</span>
            <span className="text-[10px] text-[#85858b] font-bold uppercase tracking-widest mt-0.5">Enterprise</span>
          </div>
        )}
      </div>

      {/* Nav Section */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all duration-300 relative group py-3",
                isExpanded ? "px-4" : "justify-center px-0",
                isActive 
                  ? "bg-white/5 text-white" 
                  : "text-[#85858b] hover:bg-white/[0.02] hover:text-white"
              )}
            >
              <Icon 
                size={22} 
                className={cn(
                  "transition-all duration-300",
                  isActive ? "text-[#D62828]" : "group-hover:scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              
              {isExpanded && (
                <span className="text-sm font-bold animate-in fade-in slide-in-from-left-2 duration-500">
                  {item.label}
                </span>
              )}

              {/* Active Indicator Dot */}
              {!isExpanded && isActive && (
                <div className="absolute right-2 w-1 h-1 bg-[#D62828] rounded-full shadow-[0_0_8px_#D62828]" />
              )}
              
              {/* Active Indicator Bar */}
              {isExpanded && isActive && (
                <div className="absolute left-0 w-1 h-6 bg-[#D62828] rounded-r-full shadow-[0_0_12px_rgba(214,40,40,0.4)]" />
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#1e1e1e] border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-2xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto flex flex-col gap-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl text-[#85858b] hover:text-white hover:bg-white/5 transition-all group",
            !isExpanded && "justify-center"
          )}
        >
          {isExpanded ? (
            <>
              <ChevronLeft size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Collapse</span>
            </>
          ) : (
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>

        <div className="h-px bg-white/5 w-full" />

        <div className={cn(
          "flex items-center gap-3 transition-all",
          isExpanded ? "px-2" : "justify-center"
        )}>
          <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] border border-white/5 flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0 group cursor-pointer hover:border-[#D62828]/50 transition-colors">
            U
          </div>
          {isExpanded && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
               <p className="text-white text-sm font-bold truncate">User Account</p>
               <p className="text-[10px] text-[#85858b] font-medium truncate">Free Tier</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
