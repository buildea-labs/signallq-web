"use client";

import Link from "next/link";
import { Banda } from "@/components/Banda";

export function HomeClient() {
  return (
    <div className="flex w-full flex-col">
      <Banda className="flex flex-col items-center justify-center text-center py-16 md:py-32 gap-6 min-h-[60vh]">
        <h1 className="text-[color:var(--text-primary)] font-bold text-[32px] md:text-[48px] leading-[1.2] max-w-[800px]">
          Encontre uma internet que faça sentido para você.
        </h1>
        <p className="text-[color:var(--text-secondary)] text-[16px] md:text-[20px] leading-[1.5] max-w-[600px] mx-auto">
          Descubra quanto de velocidade você realmente precisa, compare opções da sua região e entenda se sua conexão atual está adequada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link
            href="/planos"
            className="flex items-center justify-center gap-2 bg-[color:var(--accent)] text-[color:var(--on-accent)] font-medium text-[16px] px-8 py-4 rounded-xl hover:opacity-90 transition-opacity no-underline w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">search</span>
            Encontrar meu plano
          </Link>
          <Link
            href="/teste-de-velocidade"
            className="flex items-center justify-center gap-2 bg-[color-mix(in_srgb,_var(--text-primary)_8%,_transparent)] text-[color:var(--text-primary)] font-medium text-[16px] px-8 py-4 rounded-xl hover:bg-[color-mix(in_srgb,_var(--text-primary)_12%,_transparent)] transition-colors no-underline w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">troubleshoot</span>
            Minha internet está ruim
          </Link>
        </div>
      </Banda>
    </div>
  );
}
