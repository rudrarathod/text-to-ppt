import React, { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  headerActions?: ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

export function FullScreenModal({
  isOpen,
  onClose,
  title,
  children,
  headerActions,
  className,
  hideCloseButton = false
}: FullScreenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {(title || headerActions || !hideCloseButton) && (
        <div className="flex items-center justify-between p-6 bg-black/40 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
             {!hideCloseButton && (
                <button 
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <X size={20} />
                </button>
             )}
             {title && <div className="text-white font-medium text-lg">{title}</div>}
          </div>
          {headerActions && (
            <div className="flex items-center gap-3">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className={cn("flex-1 overflow-auto", className)}>
        {children}
      </div>
    </div>
  );
}
