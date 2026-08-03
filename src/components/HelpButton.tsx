"use client";

/**
 * Botão "?" com popover de uma frase — único padrão de ajuda contextual sob
 * demanda do produto (usado por ResultTechnicalDetails/#70 e pelo modo
 * Rápido/Completo em QuickTestJourney/#71). Controlado pelo chamador: quem
 * usa decide se coordena "um aberto por vez" (várias linhas) ou mantém
 * estado próprio (um único botão).
 */
export function HelpButton({
  text,
  label = "O que é isso?",
  open,
  onToggle,
  width = 200,
}: {
  text: string;
  label?: string;
  open: boolean;
  onToggle: () => void;
  width?: number;
}) {
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={label}
        className="inline-flex items-center justify-center border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity p-0"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[13px] text-[color:var(--text-tertiary)]">help</span>
      </button>
      {open && (
        <span
          style={{ width }}
          className="absolute z-10 top-6 left-1/2 -translate-x-1/2 p-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] shadow-[0_4px_24px_rgba(0,0,0,0.12)] text-[11px] leading-[1.4] text-[color:var(--text-primary)] text-center"
        >
          {text}
        </span>
      )}
    </span>
  );
}
