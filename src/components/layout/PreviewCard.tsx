import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PreviewCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  preview: ReactNode;
  actions?: ReactNode;
  topRightActions?: ReactNode;
  footer?: ReactNode;
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
  topRightActions,
  footer,
  onClick,
  className,
  isActive
}: PreviewCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-[#1e1e1e] border rounded-xl overflow-hidden transition-all duration-300 shadow-xl",
        onClick && "cursor-pointer hover:border-[#D62828] hover:shadow-[#D62828]/10 hover:-translate-y-1",
        isActive ? "border-[#D62828] shadow-[0_0_20px_rgba(214,40,40,0.1)]" : "border-[#2d2d30]",
        className
      )}
    >
      <div className="aspect-video w-full bg-[#111111] relative overflow-hidden flex items-center justify-center border-b border-[#2d2d30]">
         <div className="absolute inset-0 transition-transform group-hover:scale-105 duration-700">
           {preview}
         </div>

         {topRightActions && (
           <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-20 translate-x-2 group-hover:translate-x-0">
             {topRightActions}
           </div>
         )}

         {actions && (
           <div className={cn(
             "absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 z-10",
             isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
           )}>
             {actions}
           </div>
         )}
      </div>
      <div className="p-4 flex flex-col gap-2 bg-[#1e1e1e] flex-1">
         <div className="flex items-center justify-between gap-4">
           <div className="min-w-0 flex-1">
             <h3 className="text-white font-bold text-base truncate font-display" title={title}>{title}</h3>
           </div>
           {badge && <div className="shrink-0">{badge}</div>}
         </div>
         {subtitle && <p className="text-[#85858b] text-xs truncate">{subtitle}</p>}
         {footer && (
           <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
             {footer}
           </div>
         )}
      </div>
    </div>
  );
}
