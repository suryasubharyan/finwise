"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Subscriptions } from "@/components/dashboard/Subscriptions";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function SubscriptionsPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      <PageHeader
        icon="🔍"
        title={t.home.features[2].title}
        description={t.home.features[2].question}
      />
      <Subscriptions />
    </div>
  );
}
