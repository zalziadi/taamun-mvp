import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-panel2 px-4 py-2.5 text-text placeholder:text-muted",
          "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-danger focus:ring-danger"
            : "border-border",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
