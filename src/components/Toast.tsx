import React from 'react';
import { useAppStore } from '../store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[300px] max-w-md",
              toast.type === 'success' && "bg-[#0f1c10] border-[#22c55e]/20 text-[#22c55e]",
              toast.type === 'error' && "bg-[#1c100f] border-[#ef4444]/20 text-[#ef4444]",
              toast.type === 'info' && "bg-[#0f171c] border-[#3b82f6]/20 text-[#3b82f6]"
            )}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
