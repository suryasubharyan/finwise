"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { LockIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        type={visible ? "text" : "password"}
        icon={<LockIcon />}
        trailing={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";
