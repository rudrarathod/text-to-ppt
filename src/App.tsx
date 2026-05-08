/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { ToastContainer } from "./components/Toast";
import { Loader2 } from "lucide-react";

// Lazy load pages for better bundle size and initial load performance
const PresentationGallery = lazy(() => import("./pages/PresentationGallery").then(m => ({ default: m.PresentationGallery })));
const PresentationBuilder = lazy(() => import("./pages/PresentationBuilder").then(m => ({ default: m.PresentationBuilder })));
const PresentationViewer = lazy(() => import("./pages/PresentationViewer").then(m => ({ default: m.PresentationViewer })));
const TemplateGallery = lazy(() => import("./pages/TemplateGallery").then(m => ({ default: m.TemplateGallery })));
const TemplateBuilder = lazy(() => import("./pages/TemplateBuilder").then(m => ({ default: m.TemplateBuilder })));

import { useLocation } from "react-router-dom";
import { cn } from "./lib/utils";

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-[#111111]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-[#D62828] animate-spin" />
      <div className="text-gray-500 font-medium animate-pulse">Loading experience...</div>
    </div>
  </div>
);

function AppLayout() {
  const location = useLocation();
  const isImmersive = location.pathname.startsWith('/builder/') || 
                     (location.pathname.startsWith('/templates/') && location.pathname !== '/templates');

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#111111] text-[#1c1b1b]">
      <Navigation />
      <main className={cn(
        "flex-1 overflow-hidden h-full relative",
        !isImmersive && "pb-20 md:pb-0"
      )}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<PresentationGallery />} />
            <Route path="/builder/:id" element={<PresentationBuilder />} />
            <Route path="/builder/:id/present" element={<PresentationViewer />} />
            <Route path="/templates" element={<TemplateGallery />} />
            <Route path="/templates/:id" element={<TemplateBuilder />} />
          </Routes>
        </Suspense>
      </main>
      <ToastContainer />
    </div>
  );
}

import { useEffect } from "react";
import { useAppStore } from "./store";

export default function App() {
  const loadDefaultTemplates = useAppStore(state => state.loadDefaultTemplatesFromAssets);

  useEffect(() => {
    loadDefaultTemplates();
  }, [loadDefaultTemplates]);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
