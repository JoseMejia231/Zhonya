import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2.5">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 ml-1 block">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-zinc-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white pr-3 py-2.5 border border-zinc-200/60 rounded-xl focus:outline-none focus:border-[var(--color-brand)] dark:focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand)]/5 dark:focus:ring-[var(--color-brand)]/5 transition-all text-xs font-semibold",
              icon ? "pl-9" : "pl-4",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] text-rose-500 mt-1 ml-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
