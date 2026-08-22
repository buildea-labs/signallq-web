"use client";

import Link from "next/link";
import { Banda } from "@/components/Banda";

const FERRAMENTAS = [
  {
    title: "Teste de velocidade",
    description: "Mede o download, upload e latência (ping) reais da sua conexão.",
    href: "/teste-de-velocidade",
    icon: "speed",
  },
  {
    title: "Comparar servidores DNS",
    description: "Compare o tempo de resposta dos principais servidores (Google, Cloudflare) para descobrir qual é o mais rápido na sua rede.",
    href: "/dns",
    icon: "dns",
  },
  {
    title: "Latência para jogos",
    description: "Meça o tempo de resposta até a infraestrutura real de Steam, Riot Games e Xbox Live.",
    href: "/jogos",
    icon: "sports_esports",
  },
  {
    title: "Histórico de medições",
    description: "Acesse e compare os resultados de testes passados salvos neste dispositivo.",
    href: "/historico",
    icon: "history",
  },
];

export function FerramentasClient() {
  return (
    <div className="flex w-full flex-col">
      <Banda className="py-12 md:py-16">
        <div className="flex flex-col gap-10 w-full max-w-[800px] mx-auto">
          <div className="flex flex-col gap-4">
            <h1 className="text-[color:var(--text-primary)] font-bold text-[28px] md:text-[36px] leading-[1.2] m-0">
              Ferramentas de conexão
            </h1>
            <p className="text-[color:var(--text-secondary)] text-[16px] md:text-[18px] leading-[1.5] m-0">
              Explore os recursos de diagnóstico do SignallQ para investigar o que está acontecendo com a sua internet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FERRAMENTAS.map((ferramenta) => (
              <Link
                key={ferramenta.href}
                href={ferramenta.href}
                className="flex items-start gap-4 p-5 rounded-2xl bg-[color-mix(in_srgb,_var(--text-primary)_3%,_transparent)] border border-[color-mix(in_srgb,_var(--border)_20%,_transparent)] hover:bg-[color-mix(in_srgb,_var(--text-primary)_6%,_transparent)] transition-colors no-underline"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[color-mix(in_srgb,_var(--accent)_12%,_transparent)] text-[color:var(--accent)] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]" aria-hidden="true">{ferramenta.icon}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[16px] leading-[1.3] text-[color:var(--text-primary)]">{ferramenta.title}</span>
                  <span className="font-normal text-[14px] leading-[1.4] text-[color:var(--text-secondary)]">{ferramenta.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Banda>
    </div>
  );
}
