import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border",
          variant === "default" && "bg-panel",
          variant === "elevated" && "bg-panel2 shadow-soft",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
