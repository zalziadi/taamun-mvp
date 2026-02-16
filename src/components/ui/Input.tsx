import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 ring-white/20 transition-all focus:border-white/20 focus:outline-none focus:ring-2 disabled:opacity-60 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
