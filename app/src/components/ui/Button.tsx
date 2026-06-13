import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // Light : gradient noir → Dark : gradient blanc (contraste sur fond sombre)
  primary: [
    "bg-btn-primary text-white shadow-btn",
    "hover:shadow-btn-hover hover:brightness-110 active:scale-[0.98]",
    "dark:text-dark dark:hover:brightness-95",
  ].join(" "),

  secondary: [
    "bg-surface text-text border border-border shadow-[0_1px_2px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.8)]",
    "hover:border-border-strong hover:bg-bg active:scale-[0.98]",
    "dark:shadow-[0_1px_3px_rgb(0_0_0/0.30),inset_0_1px_0_rgb(255_255_255/0.04)]",
    "dark:hover:bg-surface-2",
  ].join(" "),

  ghost: [
    "bg-transparent text-text-2",
    "hover:bg-surface-2 hover:text-text active:scale-[0.98]",
  ].join(" "),

  danger: [
    "bg-danger text-white shadow-btn",
    "hover:brightness-110 hover:shadow-btn-hover active:scale-[0.98]",
  ].join(" "),

  accent: [
    "bg-btn-accent text-white shadow-btn",
    "hover:brightness-110 hover:shadow-btn-hover active:scale-[0.98]",
  ].join(" "),
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8  px-3   text-xs  rounded-lg  gap-1.5 tracking-snug",
  md: "h-10 px-4   text-sm  rounded-lg  gap-2   tracking-snug",
  lg: "h-12 px-5   text-sm  rounded-xl  gap-2   tracking-tight font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold select-none no-tap",
          "transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
