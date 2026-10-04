"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                {t.nav.login}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm">{t.nav.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_-10%,var(--color-emerald-100),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_30%_-10%,var(--color-emerald-950),transparent)]" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fade-in-up text-center lg:text-left">
              <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {t.home.badge}
              </span>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {t.home.heroLine1}
                <br />
                {t.home.heroLine2}
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg lg:mx-0">
                {t.home.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full px-6 py-3 text-base sm:w-auto">
                    {t.home.ctaStart}
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="w-full px-6 py-3 text-base sm:w-auto"
                  >
                    {t.home.ctaLogin}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Illustrative product preview */}
            <div className="animation-delay-200 animate-fade-in-up">
              <div className="relative mx-auto max-w-sm rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)] dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {t.home.previewLabel}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.home.previewSafeToSpend}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  ₹32,450
                </p>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                </div>

                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 dark:bg-amber-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📖</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t.home.previewInsightTitle}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      {t.home.previewInsightValue}
                    </span>
                  </div>

                  <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 dark:bg-rose-500/10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🚨</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t.home.previewAlertTitle}
                      </span>
                    </div>
                    <p className="mt-1 pl-6 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {t.home.previewAlertDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Golden moment example */}
        <section className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-3xl animate-fade-in-up">
            <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white text-center dark:border-emerald-900/50 dark:from-emerald-500/5 dark:to-slate-900 sm:p-8">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t.home.goldenLabel}
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                {t.home.goldenQuote}
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                {t.home.goldenDesc}
              </p>
            </Card>
          </div>
        </section>

        {/* Six core features */}
        <section className="bg-slate-50 px-5 py-20 dark:bg-slate-900/40 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {t.home.featuresTitle}
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                {t.home.featuresSubtitle}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.home.features.map((feature, i) => (
                <Card
                  key={feature.title}
                  className="animate-fade-in-up hover:-translate-y-1"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-xl dark:from-emerald-500/15 dark:to-emerald-500/5">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {feature.question}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Product loop */}
        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t.home.loopTitle}
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              {t.home.loopSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {t.home.loopSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2 sm:gap-3">
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {step}
                  </span>
                  {i < t.home.loopSteps.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Principles strip */}
        <section className="border-y border-slate-200 bg-slate-50 px-5 py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:px-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.home.principle1Title}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t.home.principle1Desc}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.home.principle2Title}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t.home.principle2Desc}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.home.principle3Title}
              </p>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                {t.home.principle3Desc}
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-2xl text-center animate-fade-in-up">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t.home.finalCtaTitle}
            </h2>
            <div className="mt-7">
              <Link href="/register">
                <Button className="px-7 py-3 text-base">
                  {t.home.finalCtaButton}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-5 py-8 dark:border-slate-800 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {t.home.footerTagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
