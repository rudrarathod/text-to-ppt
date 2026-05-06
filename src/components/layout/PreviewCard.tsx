import React, { ReactNode, useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}

interface PreviewCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  preview: ReactNode;
  menuItems?: MenuAction[];
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
  isCreateCard?: boolean;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  title,
  subtitle,
  badge,
  preview,
  menuItems,
  footer,
  onClick,
  className,
  isActive,
  isCreateCard
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-[#161618] border rounded-2xl transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.98]",
        isCreateCard ? "border-dashed border-[#2d2d30] hover:border-[#D62828] hover:bg-[#D62828]/5" : (isActive ? "border-[#D62828]" : "border-[#2d2d30] hover:border-[#3d3d40]"),
        className
      )}
    >
      {/* Preview Area */}
      <div className={cn(
        "aspect-video w-full relative overflow-hidden rounded-t-2xl",
        isCreateCard ? "bg-transparent flex items-center justify-center" : "bg-[#111111]"
      )}>
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          !isCreateCard && "inset-0"
        )}>
          {preview}
        </div>
      </div>

      {/* Card Footer */}
      <div className={cn(
        "px-4 py-3 flex items-center gap-2",
        isCreateCard && "justify-center"
      )}>
        <div className={cn(
          "flex-1 min-w-0",
          isCreateCard && "text-center"
        )}>
          <h3 className={cn(
            "text-white font-semibold text-sm truncate leading-tight",
            isCreateCard && "text-base"
          )} title={title}>
            {title}
          </h3>
          {(subtitle || footer) && !isCreateCard && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 truncate">
              {subtitle && <span>{subtitle}</span>}
              {footer}
            </div>
          )}
        </div>

        {badge && <div className="shrink-0">{badge}</div>}

        {/* 3-dot menu — always visible, positioned in the footer row */}
        {menuItems && menuItems.length > 0 && (
          <div
            ref={menuRef}
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all",
                menuOpen && "text-white bg-white/10"
              )}
              aria-label="More actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div
                className="absolute bottom-full right-0 mb-1 w-44 bg-[#1e1e1e] border border-[#2d2d30] rounded-xl shadow-2xl overflow-hidden z-[200] animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {menuItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      item.onClick(e);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left",
                      item.danger
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-gray-300 hover:bg-white/5"
                    )}
                  >
                    {item.icon && (
                      <span className="shrink-0 opacity-70">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
