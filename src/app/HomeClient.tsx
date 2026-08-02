"use client";

import { PageShell } from "@/components/PageShell";
import { CompleteDiagnosis } from "@/components/home/CompleteDiagnosis";
import { HomeProductContext } from "@/components/home/HomeProductContext";
import { QuickTestJourney } from "@/components/home/QuickTestJourney";
import { useSpeedTestJourney } from "@/hooks/useSpeedTestJourney";

export function HomeClient() {
  const journey = useSpeedTestJourney();

  return (
    <PageShell align={journey.shellAlign} contentMax={journey.modo === "rapido" ? "1200px" : "860px"}>
      <QuickTestJourney journey={journey} />
      {!journey.isProblem && <CompleteDiagnosis journey={journey} />}
      <HomeProductContext visible={journey.isIdle && !journey.isProblem} />
    </PageShell>
  );
}
