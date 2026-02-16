import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "default" | "lg";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-bg hover:bg-gold2 focus-visible:ring-gold shadow-soft",
  secondary:
    "bg-panel2 text-text border border-border hover:bg-panel focus-visible:ring-gold",
  ghost:
    "bg-transparent text-text hover:bg-panel2 focus-visible:ring-gold",
  danger:
    "bg-danger/90 text-white hover:bg-danger focus-visible:ring-danger",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  default: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
          sizeStyles[size],
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
