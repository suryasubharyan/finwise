import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, trailing, className = "", id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20 ${
              icon ? "pl-10" : "px-3.5"
            } ${trailing ? "pr-10" : icon ? "pr-3.5" : ""} ${className}`}
            {...props}
          />
          {trailing && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2">
              {trailing}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
