"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { MoneyStory } from "@/components/dashboard/MoneyStory";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function MoneyStoryPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl">
      <PageHeader
        icon="📖"
        title={t.home.features[0].title}
        description={t.home.features[0].question}
      />
      <MoneyStory />
    </div>
  );
}
