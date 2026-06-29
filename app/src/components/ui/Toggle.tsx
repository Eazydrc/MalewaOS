import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

export function Toggle({ checked, onChange, disabled, size = "md", className, ...rest }: ToggleProps) {
  const track = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const knob  = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const travel = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        track,
        "relative shrink-0 rounded-full no-tap",
        "transition-colors duration-300 ease-out",
        "shadow-inner",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        checked
          ? "bg-gradient-to-r from-accent to-accent/80"
          : "bg-surface-3 dark:bg-zinc-700",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          knob,
          "absolute top-0.5 left-0.5 rounded-full bg-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? travel : "translate-x-0",
        )}
      />
    </button>
  );
}
