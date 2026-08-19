"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  mono?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, mono, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-xs font-medium text-ink-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 rounded-xl border border-border bg-surface px-4 text-[15px] text-ink-primary placeholder:text-ink-muted outline-none transition-all duration-150",
            "focus:border-signal/60 focus:bg-surface-raised focus:shadow-ring",
            mono && "font-mono uppercase tracking-[0.2em]",
            error && "border-coral/60",
            className ?? undefined
          )}
          {...props}
        />
        {error ? <span className="text-xs text-coral">{error}</span> : null}
      </div>
    );
  }
);
TextField.displayName = "TextField";
