import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "muted" | "success" | "danger";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  muted: "bg-panel2 border-border text-muted",
  success: "bg-success/10 border-success/30 text-success",
  danger: "bg-danger/10 border-danger/30 text-danger",
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "muted", title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {title && (
          <div className="font-semibold mb-1 text-text">{title}</div>
        )}
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";
