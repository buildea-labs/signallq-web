"use client";

import { useEffect, type RefObject } from "react";

const FOCAVEIS = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento de janela modal: prende o foco dentro do painel, fecha no Esc,
 * trava a rolagem do fundo e devolve o foco a quem abriu.
 *
 * Extraído de `DiagnoseSheet` para ficar reaproveitável e testável por conta
 * própria — é o tipo de coisa que costuma ser reimplementada errada em cada
 * modal novo.
 */
export function useFocusTrap(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const anterior = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;

      const focaveis = panel.current.querySelectorAll<HTMLElement>(FOCAVEIS);
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
      anterior?.focus();
    };
  }, [open, onClose, panel]);
}
