"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Goals } from "@/components/dashboard/Goals";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function GoalsPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      <PageHeader icon="🎯" title={t.dashboard.goalsSection.title} />
      <Goals />
    </div>
  );
}
