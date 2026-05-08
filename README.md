# 📊 Text to PPT (AI Presentation Builder)

An AI-powered presentation generation tool built with React, Vite, and Tailwind CSS. This application takes text prompts and intelligently structures them into professional slides, with support for customizable themes, layouts, and direct export to multiple formats.

## ✨ Features

- 🤖 **AI-Powered Content Generation:** Transform simple text prompts into well-structured presentations using advanced AI models through OpenRouter and Gemini.
- 🎨 **Dynamic Theming:** Choose from multiple themes, typography combinations, and design systems for a polished look.
- ⚡ **Interactive Editor:** Real-time preview and editing of slides using a rich React-based interface.
- 🖼️ **Image Support:** Integrated image handling and state management for presentations.
- 📤 **Multiple Export Options:** Export your finished presentations effortlessly to:
  - PowerPoint (.pptx)
  - PDF
  - Images

## 🛠️ Tech Stack

- **Frontend Framework:** React 19, Vite
- **Styling:** Tailwind CSS, Tailwind Merge, clsx, Lucide React (Icons)
- **State Management:** Zustand, IndexedDB (via `idb` for persistent storage)
- **Routing:** React Router DOM
- **AI Integrations:** OpenRouter SDK, Gemini APIs
- **Animations:** Framer Motion
- **Exporting & Utilities:** `pptxgenjs`, `jspdf`, `html-to-image`, `html2canvas`
- **Backend/Scripts:** Express, `tsx`

## 🏗️ Project Structure

```text
src/
├── App.tsx                    # Main Application Setup
├── components/                # Reusable UI component library
│   ├── ai/                    # AI Assistant panels and UI
│   ├── design-system/         # Theme pickers, typography
│   ├── layout/                # Page layouts, modal components
│   └── ui.tsx                 # Core UI building blocks
├── lib/                       # Utility functions, exports, AI integrations
├── pages/                     # Full-page route components (Gallery, Viewer, Builder)
├── server/                    # Local dev server utilities (Express)
└── store/                     # Global state (Zustand)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root directory and add necessary API keys:
   ```env
   VITE_OPENROUTER_API_KEY="your_api_key_here"
   VITE_GEMINI_API_KEY="your_api_key_here"
   ```

### Running Locally

Start the Vite development frontend server:
```bash
npm run dev
```

Run the backend/utility server (if required for specific generation APIs):
```bash
npm run server
```

### Build for Production

Compile TypeScript and build the React application for production deployment:
```bash
npm run build
```

## 📜 Scripts Overview

- `npm run dev`: Starts the local dev server using Vite (available at http://localhost:3000).
- `npm run build`: Bundles the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run server`: Runs the local Node/Express server via `tsx`.
- `npm run clean`: Removes the `dist` compilation folder.
- `npm run lint`: Runs TypeScript compiler for type-checking without emitting files.
