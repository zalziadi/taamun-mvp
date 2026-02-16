import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "rounded-xl bg-gradient-to-l from-white/90 to-white/70 px-6 py-3 font-bold text-[#0B0F14 transition-all hover:from-white hover:to-white/90 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", type = "button", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
