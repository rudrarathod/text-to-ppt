/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { PresentationBuilder } from "./pages/PresentationBuilder";
import { TemplateBuilder } from "./pages/TemplateBuilder";
import { TemplateGallery } from "./pages/TemplateGallery";
import { PresentationGallery } from "./pages/PresentationGallery";


import { PresentationViewer } from "./pages/PresentationViewer";
import { ToastContainer } from "./components/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#111111] text-[#1c1b1b]">
        <Navigation />
        <main className="flex-1 overflow-hidden h-full relative">
          <Routes>
            <Route path="/" element={<PresentationGallery />} />
            <Route path="/builder/:id" element={<PresentationBuilder />} />
            <Route path="/builder/:id/present" element={<PresentationViewer />} />
            <Route path="/templates" element={<TemplateGallery />} />
            <Route path="/templates/:id" element={<TemplateBuilder />} />

          </Routes>
        </main>
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
