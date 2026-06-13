import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string;
  error?: string;
  helper?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, prefix, suffix, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("space-y-1.5", fullWidth && "w-full")}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative group">
          {prefix && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 flex items-center pointer-events-none transition-colors group-focus-within:text-text-2">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-base py-2.5",
              prefix ? "pl-9 pr-3.5" : "px-3.5",
              suffix ? "pr-10" : "",
              error && "border-danger focus:border-danger focus:shadow-input-err",
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 flex items-center">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-danger font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs text-text-3 leading-relaxed">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
