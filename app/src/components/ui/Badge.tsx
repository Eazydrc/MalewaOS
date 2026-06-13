import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "accent" | "info";
type BadgeSize    = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-text-2 border border-border",
  success: "bg-success-soft text-success border border-success/15",
  danger:  "bg-danger-soft text-danger border border-danger/15",
  warning: "bg-warning-soft text-warning border border-warning/15",
  accent:  "bg-accent-soft text-accent border border-accent/15",
  info:    "bg-blue-50 text-blue-600 border border-blue-200/60",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-text-3",
  success: "bg-success",
  danger:  "bg-danger",
  warning: "bg-warning",
  accent:  "bg-accent",
  info:    "bg-blue-500",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "h-5  px-1.5  text-[10px] gap-1   font-semibold",
  md: "h-6  px-2.5  text-[11px] gap-1.5 font-semibold",
};

export function Badge({ variant = "default", size = "md", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full shadow-pill tracking-wide",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}
