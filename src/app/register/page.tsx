"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { UserIcon, MailIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-slate-950 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-emerald-100),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-emerald-950),transparent)]" />

      <div className="absolute top-4 right-4 flex items-center gap-2 sm:top-6 sm:right-6">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <Card className="relative overflow-hidden sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />

          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t.auth.registerTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.auth.registerSubtitle}
          </p>

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600 animate-fade-in dark:bg-rose-500/10 dark:text-rose-400">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              id="name"
              label={t.auth.nameLabel}
              type="text"
              icon={<UserIcon />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.auth.namePlaceholder}
              required
            />
            <Input
              id="email"
              label={t.auth.emailLabel}
              type="email"
              icon={<MailIcon />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              required
            />
            <PasswordInput
              id="password"
              label={t.auth.passwordLabel}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholderRegister}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              {loading ? t.auth.creatingAccount : t.auth.createAccountButton}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.auth.alreadyHaveAccount}{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {t.auth.loginLink}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
