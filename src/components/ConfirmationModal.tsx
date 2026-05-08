import React from "react";
import { Trash2, AlertCircle, Info, X } from "lucide-react";
import { Button } from "./ui";
import { cn } from "../lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = 'danger',
  icon
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-[#D62828]/20',
          iconColor: 'text-[#D62828]',
          confirmBg: 'bg-[#D62828] hover:bg-[#b20112]',
          defaultIcon: <Trash2 size={24} />
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-500',
          confirmBg: 'bg-amber-500 hover:bg-amber-600',
          defaultIcon: <AlertCircle size={24} />
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-500',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          defaultIcon: <Info size={24} />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", styles.iconBg, styles.iconColor)}>
          {icon || styles.defaultIcon}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        
        <div className="text-gray-400 mb-6 font-medium text-sm leading-relaxed">
          {message}
        </div>
        
        <div className="flex gap-3 w-full">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold"
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            className={cn("flex-1 text-white font-bold border-none", styles.confirmBg)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
