import { Banda } from "@/components/Banda";
import type { Metadata } from "next";
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
    <Banda className="py-8 md:py-12 lg:py-16">
      <PingTool />
    </Banda>
  );
}
