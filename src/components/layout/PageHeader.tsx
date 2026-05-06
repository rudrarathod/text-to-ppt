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
    <div className="bg-[#0f0f10] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        {backTo && (
          <Link to={backTo} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-[#D62828]/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">{title}</h1>
            {subtitle && <p className="text-[#85858b] text-xs">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
         {actions && <div className="flex items-center gap-3">{actions}</div>}
         {rightPanel}
      </div>
    </div>
  );
}
