import React, { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface GalleryLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function GalleryLayout({
  title,
  subtitle,
  icon,
  headerActions,
  children
}: GalleryLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-[#111111] overflow-auto text-gray-200">
      <PageHeader 
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={headerActions}
      />

      <div className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}
