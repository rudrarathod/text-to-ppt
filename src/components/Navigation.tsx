import { Link, useLocation } from "react-router-dom";
import { Presentation, LayoutTemplate, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";

export function Navigation() {
  const location = useLocation();
  
  // Immersive mode: Hide navbar in builder and template editor
  const isBuilderPage = location.pathname.startsWith('/builder/') || 
                       (location.pathname.startsWith('/templates/') && location.pathname !== '/templates');

  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem("sidebar-pinned") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-pinned", String(isExpanded));
  }, [isExpanded]);

  if (isBuilderPage) return null;

  interface NavItem {
    label: string;
    icon: any;
    path: string;
    match: (path: string) => boolean;
  }

  const navItems: NavItem[] = [
    { 
      label: "Gallery", 
      icon: Presentation, 
      path: "/", 
      match: (p: string) => p === "/"
    },
    { 
      label: "Templates", 
      icon: LayoutTemplate, 
      path: "/templates", 
      match: (p: string) => p.startsWith("/templates") 
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0b] border-t border-white/5 z-50 px-8 py-4 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-200",
                isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-4 w-8 h-0.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex bg-[#0a0a0b] border-r border-white/5 transition-all duration-300 ease-in-out relative z-50 flex-col shrink-0",
          isExpanded ? "w-60" : "w-16",
          "h-full py-8 px-3"
        )}
      >
        {/* Brand Logo */}
        <div className={cn(
          "flex items-center gap-3 px-2 mb-12 transition-all",
          !isExpanded && "justify-center"
        )}>
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="DOMINO Logo" className="w-full h-full object-contain" />
          </div>
          {isExpanded && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <span className="font-bold text-white text-base tracking-tight leading-none">DOMINO</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Creator Suite</span>
            </div>
          )}
        </div>

        {/* Nav Section */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = item.match(location.pathname);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-all duration-200 group py-2.5",
                  isExpanded ? "px-3" : "justify-center px-0",
                  isActive 
                    ? "bg-white/5 text-white" 
                    : "text-gray-500 hover:text-white"
                )}
              >
                <Icon 
                  size={18} 
                  className="transition-transform duration-200 group-hover:scale-105" 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                
                {isExpanded && (
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                )}

                {/* Active Indicator Bar */}
                {isExpanded && isActive && (
                  <div className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                )}

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#1a1a1b] border border-white/10 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100]">
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
    </>
  );
}

