import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { DiagnosticoShell } from "@/components/diagnostico/DiagnosticoShell";
import { FerramentasSecao } from "@/components/diagnostico/FerramentasSecao";

export const metadata: Metadata = {
  title: "SignallQ — Protótipo de diagnóstico",
  description: "Protótipo isolado da jornada de diagnóstico do SignallQ WebApp e desktop.",
  robots: { index: false, follow: false },
};

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen w-full sq-diagnostico-bg">
      <PageShell contentMax="1200px">
        <DiagnosticoShell ferramentas={<FerramentasSecao />} />
      </PageShell>
    </div>
  );
}
