import React, { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  backTo?: string;
  actions?: ReactNode;
  rightPanel?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  backTo,
  actions,
  rightPanel
}: PageHeaderProps) {
  return (
    <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex items-center justify-between shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        {backTo && (
          <Link to={backTo} className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="flex items-center gap-4">
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-white font-bold text-base tracking-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5 font-bold">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
         {actions && <div className="flex items-center gap-3">{actions}</div>}
         {rightPanel}
      </div>
    </div>
  );
}
