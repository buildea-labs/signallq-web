import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { PingTool } from "@/components/ping/PingTool";

export const metadata: Metadata = {
  title: "Teste de Ping - Meça o Tempo de Resposta da sua Internet | SignallQ",
  description:
    "Meça o tempo de resposta (ping) e o jitter da sua conexão direto no navegador, sem instalar nada. Entenda o que o número significa para jogos e chamadas.",
  alternates: {
    canonical: "https://signallq.com/ping",
  },
};

export default function PingPage() {
  return (
    <PageShell align="center" contentMax="560px">
      <PingTool />
    </PageShell>
  );
}
