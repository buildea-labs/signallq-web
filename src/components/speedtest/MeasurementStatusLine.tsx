"use client";

/**
 * Linha de estado da medição — ponto pulsante + frase da fase corrente, 1:1
 * com o protótipo (`SignallQ Speed Flow.dc.html`, telas 1.2 e 2.2).
 *
 * O protótipo alterna frases num carrossel decorativo; aqui a frase vem da
 * fase real do motor, então não há segunda fonte de verdade nem texto que
 * afirme algo que a medição não está fazendo.
 */
export function MeasurementStatusLine({ text, step }: { text: string; step?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {step && (
        <p className="m-0 font-semibold text-[11.5px] leading-[1.4] tracking-[.2px] text-[color:var(--text-secondary)]">{step}</p>
      )}
      <p className="m-0 flex items-center justify-center gap-[7px] text-center" role="status" aria-live="polite">
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--accent)] sq-status-dot"
        />
        <span className="font-semibold text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{text}</span>
      </p>
    </div>
  );
}
