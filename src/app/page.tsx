"use client";

import { PageShell } from "@/components/PageShell";
import { CompleteDiagnosis } from "@/components/home/CompleteDiagnosis";
import { HomeProductContext } from "@/components/home/HomeProductContext";
import { QuickTestJourney } from "@/components/home/QuickTestJourney";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useSpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { PAGE_META } from "@/lib/pageMetaCatalog";

export default function Home() {
  useDocumentMeta(PAGE_META["/"]);
  const journey = useSpeedTestJourney();

  return (
    <PageShell align={journey.shellAlign}>
      <QuickTestJourney journey={journey} />
      {!journey.isProblem && <CompleteDiagnosis journey={journey} />}
      <HomeProductContext visible={journey.isIdle && !journey.isProblem} />
    </PageShell>
  );
}
