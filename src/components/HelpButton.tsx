"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Botão "?" com popover de uma frase — único padrão de ajuda contextual sob
 * demanda do produto (usado por ResultTechnicalDetails/#70 e pelo modo
 * Rápido/Completo em QuickTestJourney/#71). Controlado pelo chamador: quem
 * usa decide se coordena "um aberto por vez" (várias linhas) ou mantém
 * estado próprio (um único botão).
 *
 * O popover é centralizado sob o botão por padrão, mas em viewports estreitas
 * (ex.: 375px) a centralização fixa pode empurrar a borda do popover para
 * fora da tela quando o botão está perto de uma das bordas (#70/#71). Por
 * isso a posição horizontal final é corrigida via `useLayoutEffect`, que mede
 * o retângulo real do popover e aplica um deslocamento (`shift`) apenas o
 * suficiente para mantê-lo dentro da viewport, sem alterar a centralização
 * quando não há risco de overflow.
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
  const popoverRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    if (!open) {
      setShift(0);
      return;
    }
    const node = popoverRef.current;
    if (!node) return;

    const viewportMargin = 8;
    const rect = node.getBoundingClientRect();
    const overflowRight = rect.right - (window.innerWidth - viewportMargin);
    const overflowLeft = viewportMargin - rect.left;

    if (overflowRight > 0) {
      setShift((current) => current - overflowRight);
    } else if (overflowLeft > 0) {
      setShift((current) => current + overflowLeft);
    }
  }, [open, width]);

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
          ref={popoverRef}
          style={{
            width: `min(${width}px, calc(100vw - 16px))`,
            transform: `translateX(calc(-50% + ${shift}px))`,
          }}
          className="absolute z-10 top-6 left-1/2 p-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-secondary)] shadow-[0_4px_24px_rgba(0,0,0,0.12)] text-[11px] leading-[1.4] text-[color:var(--text-primary)] text-center"
        >
          {text}
        </span>
      )}
    </span>
  );
}
