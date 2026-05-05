import React from "react";
import { cn } from "../lib/utils";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost", size?: "default" | "sm" | "lg" }>( 
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lumina-primary disabled:pointer-events-none disabled:opacity-100 disabled:bg-[#E0E0E0] disabled:text-[#A0A0A0] disabled:shadow-none disabled:border-none",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 text-xs rounded-md",
          size === "lg" && "h-12 px-6 rounded-xl",
          variant === "primary" && "bg-gradient-to-br from-[#FF6347] to-[#D62828] text-white shadow-[0_4px_14px_0_rgba(214,40,40,0.39)] hover:shadow-[0_6px_20px_rgba(214,40,40,0.23)] hover:-translate-y-[1px]",
          variant === "secondary" && "bg-[#F1F1F1] text-[#1c1b1b] shadow-sm hover:bg-[#e5e5e5]",
          variant === "outline" && "border-2 border-[#D62828] bg-transparent text-[#D62828] hover:bg-[#D62828]/5",
          variant === "ghost" && "hover:bg-lumina-border hover:text-[#1c1b1b]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>( 
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-2xl border-2 border-lumina-border bg-lumina-bg px-4 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-lumina-text-secondary focus-visible:outline-none focus-visible:border-[#D62828] focus-visible:ring-1 focus-visible:ring-[#D62828] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>( 
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border-2 border-lumina-border bg-lumina-bg px-4 py-3 text-base shadow-sm placeholder:text-lumina-text-secondary focus-visible:outline-none focus-visible:border-[#D62828] focus-visible:ring-1 focus-visible:ring-[#D62828] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
