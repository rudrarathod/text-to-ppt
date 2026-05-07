import React from 'react';
import { Search, Plus, Play, Download, Settings, Heart, Bell, Share2, Info, ChevronRight, User, Palette, MousePointer2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleFontLoader } from '../lib/typography';
import { DesignConfig } from '../store';

interface ThemeShowcaseProps {
    config: DesignConfig;
}

import { CanvasRenderer } from './canvas/CanvasRenderer';

interface SlideShowcaseProps {
    config: DesignConfig;
}

export const SlideShowcase: React.FC<SlideShowcaseProps> = ({ config }) => {
    const fontFamilies = Array.from(new Set([
        config.typeDisplayXl.fontFamily,
        config.typeHeadlineLg.fontFamily,
        config.typeBodyLg.fontFamily,
        config.typeLabelSm.fontFamily
    ]));

    return (
        <CanvasRenderer
            type="theme"
            config={config}
            aspectRatio={1400 / 900} // Custom aspect ratio for showcase
            className="p-4 lg:p-8 animate-in fade-in duration-700 select-none"
        >
            <GoogleFontLoader fonts={fontFamilies} />

            <div class="flex flex-col items-center justify-center h-full w-full bg-lumina-bg p-20 text-center rounded-lumina">
                <h1 class="text-7xl font-black text-lumina-primary mb-6">titel</h1>
                <div class="w-24 h-2 bg-lumina-secondary mb-8"></div>
                <h2 class="text-3xl font-medium text-lumina-text-secondary">subtitle</h2>
            </div>
            
        </CanvasRenderer>
    );
};
