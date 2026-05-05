/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { SlideGenerator } from "./pages/SlideGenerator";
import { TemplateBuilder } from "./pages/TemplateBuilder";
import { TemplateGallery } from "./pages/TemplateGallery";
import { PresentationGallery } from "./pages/PresentationGallery";
import { MagicBuilder } from "./pages/MagicBuilder";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#111111] text-[#1c1b1b]">
        <Navigation />
        <main className="flex-1 overflow-hidden h-full relative">
          <Routes>
            <Route path="/" element={<PresentationGallery />} />
            <Route path="/presentations/:id" element={<SlideGenerator />} />
            <Route path="/templates" element={<TemplateGallery />} />
            <Route path="/templates/:id" element={<TemplateBuilder />} />
            <Route path="/magic-builder" element={<MagicBuilder />} />
            <Route path="/magic-builder/:id" element={<MagicBuilder />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
