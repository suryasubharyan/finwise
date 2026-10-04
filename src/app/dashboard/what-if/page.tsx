"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { WhatIf } from "@/components/dashboard/WhatIf";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function WhatIfPage() {
  const { t } = useLanguage();
  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      <PageHeader
        icon="🔀"
        title={t.home.features[4].title}
        description={t.home.features[4].question}
      />
      <WhatIf />
    </div>
  );
}
