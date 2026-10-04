"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { FireAlarm } from "@/components/dashboard/FireAlarm";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function FireAlarmPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-3xl">
      <PageHeader
        icon="🚨"
        title={t.home.features[1].title}
        description={t.home.features[1].question}
      />
      <FireAlarm />
    </div>
  );
}
