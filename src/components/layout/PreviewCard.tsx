import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PreviewCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  preview: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  subtitle,
  badge,
  preview,
  actions,
  onClick,
  className,
  isActive
}: PreviewCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-[#161618] border rounded-2xl overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:border-white/20 hover:shadow-2xl hover:-translate-y-1",
        isActive ? "border-[#D62828] shadow-[0_0_20px_rgba(214,40,40,0.1)]" : "border-[#2d2d30]",
        className
      )}
    >
      <div className="aspect-video w-full bg-[#111111] relative overflow-hidden flex items-center justify-center p-2">
         {preview}
         {actions && (
           <div className={cn(
             "absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 z-20",
             isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
           )}>
             {actions}
           </div>
         )}
      </div>
      <div className="p-4 border-t border-[#2d2d30]">
         <div className="flex items-center justify-between gap-4">
           <div className="min-w-0 flex-1">
             <h3 className="text-white font-bold text-sm truncate">{title}</h3>
             {subtitle && <p className="text-[#85858b] text-xs mt-1 truncate">{subtitle}</p>}
           </div>
           {badge && <div className="shrink-0">{badge}</div>}
         </div>
      </div>
    </div>
  );
}
