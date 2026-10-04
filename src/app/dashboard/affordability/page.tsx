"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Affordability } from "@/components/dashboard/Affordability";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function AffordabilityPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      <PageHeader
        icon="🧮"
        title={t.home.features[3].title}
        description={t.home.features[3].question}
      />
      <Affordability />
    </div>
  );
}
