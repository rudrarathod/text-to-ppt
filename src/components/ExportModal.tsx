import React from "react";
import { X, Download, Presentation as PresentationIcon, Layout as LayoutIcon, Loader2 } from "lucide-react";
import { Button } from "./ui";
import { cn } from "../lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'PDF' | 'PPTX' | 'PNG' | 'Google Slides') => void;
  isExporting: boolean;
  exportType: string;
}

export function ExportModal({ isOpen, onClose, onExport, isExporting, exportType }: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-full bg-[#D62828]/20 text-[#D62828] flex items-center justify-center mb-4">
          <Download size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-6 w-full text-center">
          Export Options
        </h3>
        
        <div className="flex flex-col gap-3 w-full">
          <Button 
            onClick={() => onExport('PDF')}
            disabled={isExporting}
            className="w-full justify-start gap-3 bg-[#2d2d30] border border-[#3d3d40] hover:bg-[#3d3d40] hover:border-white/20 h-12 text-sm text-white shadow-none transition-all active:scale-[0.98]"
          >
             {isExporting && exportType === 'PDF' ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Download size={18} className="text-[#D62828]" />} Export to PDF
          </Button>

          <Button 
            onClick={() => onExport('PPTX')}
            disabled={isExporting}
            className="w-full justify-start gap-3 bg-[#2d2d30] border border-[#3d3d40] hover:bg-[#3d3d40] hover:border-white/20 h-12 text-sm text-white shadow-none transition-all active:scale-[0.98]"
          >
             {isExporting && exportType === 'PPTX' ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <PresentationIcon size={18} className="text-[#D62828]" />} Export to PowerPoint
          </Button>

          <Button 
            onClick={() => onExport('Google Slides')}
            disabled={isExporting}
            className="w-full justify-start gap-3 bg-[#2d2d30] border border-[#3d3d40] hover:bg-[#3d3d40] hover:border-white/20 h-12 text-sm text-white shadow-none transition-all active:scale-[0.98]"
          >
             {isExporting && exportType === 'Google Slides' ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <LayoutIcon size={18} className="text-[#D62828]" />} Export to Google Slides
          </Button>

          <Button 
            onClick={() => onExport('PNG')}
            disabled={isExporting}
            className="w-full justify-start gap-3 bg-[#2d2d30] border border-[#3d3d40] hover:bg-[#3d3d40] hover:border-white/20 h-12 text-sm text-white shadow-none transition-all active:scale-[0.98]"
          >
             {isExporting && exportType === 'PNG' ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Download size={18} className="text-[#D62828]" />} Export as PNGs
          </Button>
        </div>
      </div>
    </div>
  );
}
