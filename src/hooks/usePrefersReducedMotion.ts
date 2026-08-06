"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Preferência de movimento reduzida do sistema.
 *
 * O CSS já neutraliza animações declarativas (`src/index.css`), mas o
 * velocímetro interpola valores em JavaScript — sem ler a preferência aqui, o
 * mostrador continuaria animando número, arco e ponteiro. Começa em `false`
 * para casar com o HTML renderizado no servidor e ajusta na montagem.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(QUERY);
    setReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
