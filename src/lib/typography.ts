import { useEffect } from "react";

export const GoogleFontLoader = ({ fonts }: { fonts: string[] }) => {
  useEffect(() => {
    if (fonts.length === 0) return;
    
    const uniqueFonts = Array.from(new Set(fonts)).filter(f => f && f !== 'sans-serif' && f !== 'serif' && f !== 'monospace');
    if (uniqueFonts.length === 0) return;

    const linkId = 'dynamic-google-fonts';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    link.href = `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => `${f.replace(/\\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900`).join('&family=')}&display=swap`;
  }, [fonts]);

  return null;
};

export const POPULAR_FONTS = [
  "Inter", "Montserrat", "Open Sans", "Roboto", "Lato", "Poppins", "Oswald", "Lora", 
  "Montserrat", "Raleway", "Ubuntu", "Merriweather", "Playfair Display", "Nunito", 
  "Muli", "Quicksand", "Work Sans", "Rubik", "Kanit", "Nanum Gothic", "Fira Sans", 
  "PT Sans", "Josefin Sans", "Bebas Neue", "Arvo", "Libre Baskerville", "Exo 2", 
  "Pacifico", "Caveat", "Indie Flower", "Dancing Script", "Zilla Slab", "Space Grotesk", 
  "Outfit", "Be Vietnam Pro", "JetBrains Mono", "Space Mono", "Syne", "Urbanist", "Clash Display"
];
