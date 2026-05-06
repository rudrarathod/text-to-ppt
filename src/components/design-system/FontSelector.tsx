import React from "react";
import { Search } from "lucide-react";
import { POPULAR_FONTS } from "../../lib/typography";

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FontSelector({ label, value, onChange, searchQuery, onSearchChange }: FontSelectorProps) {
  const fonts = React.useMemo(() => {
    const base = searchQuery 
      ? [searchQuery, ...POPULAR_FONTS.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()) && f !== searchQuery)]
      : POPULAR_FONTS;
    if (value && !base.includes(value)) {
      return [value, ...base];
    }
    return Array.from(new Set(base));
  }, [searchQuery, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500 uppercase">{label}</span>
        <div className="relative group/search">
          <Search size={8} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search Font..."
            className="bg-white/5 border border-white/5 rounded-md pl-4 pr-2 py-0.5 text-[8px] text-white outline-none focus:border-[#D62828] w-28 transition-all"
          />
        </div>
      </div>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#D62828]"
      >
        {fonts.map(f => (
          <option key={f} value={f} className="bg-[#161618]">{f}</option>
        ))}
      </select>
    </div>
  );
}
