"use client";

/**
 * Selo acima do mostrador no resultado ("Teste rápido · Executado agora"),
 * 1:1 com a tela 1.3 do protótipo. O ponto colorido reforça o estado, mas o
 * texto sozinho já basta — nada aqui depende só de cor.
 */
export function ResultStamp({ label, tone = "success" }: { label: string; tone?: "success" | "neutral" }) {
  return (
    <p className="m-0 flex items-center justify-center gap-[6px]">
      <span
        aria-hidden="true"
        className="h-[6px] w-[6px] shrink-0 rounded-full"
        style={{ background: tone === "success" ? "var(--success)" : "var(--text-tertiary)" }}
      />
      <span className="font-semibold text-[11.5px] leading-[1.4] text-[color:var(--text-secondary)]">{label}</span>
    </p>
  );
}
