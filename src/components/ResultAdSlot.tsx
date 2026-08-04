"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ADSENSE_PUBLISHER_ID, ADSENSE_RESULT_AD_SLOT } from "../lib/config";
import { getAdConsent, getAdConsentServerSnapshot, subscribeToAdConsent } from "../lib/adConsent";

/**
 * Único slot de anúncio autorizado (issue #21, "Direção inicial" de Juliana).
 * Não duplica a lógica de gate de `AdSenseScript`/`adConsent.ts` — só decide
 * se ESTE slot específico aparece, reaproveitando a mesma store de
 * consentimento e o mesmo publisher id.
 *
 * Regras de compliance exigidas pela issue (todas aplicadas aqui):
 * - nunca renderiza sem publisher id E slot id configurados (evita `<ins>`
 *   sem unidade de anúncio real por trás);
 * - nunca renderiza sem consentimento explicitamente aceito — sem decisão
 *   ou com recusa, retorna `null` por completo (sem espaço reservado
 *   visível, sem "buraco vazio");
 * - só é montado pelo chamador (`CompleteDiagnosis`) depois do resultado
 *   completo e de todas as ações (reteste/compartilhar/copiar resumo) e do
 *   questionário contextual — nunca durante teste em andamento, diagnóstico
 *   ou dentro do velocímetro;
 * - contêiner com `aspect-ratio` fixo reservado no mesmo render em que o
 *   `<ins>` aparece, para não causar CLS enquanto o script do AdSense ainda
 *   não pintou o criativo;
 * - rótulo "Publicidade" sempre visível, em texto simples (sem estilo de
 *   botão, card de resultado ou recomendação);
 * - sem overlay/popup/autoplay/refresh — `<ins>` estático padrão do AdSense,
 *   solicitado uma única vez por montagem.
 */
export function ResultAdSlot() {
  const consent = useSyncExternalStore(subscribeToAdConsent, getAdConsent, getAdConsentServerSnapshot);
  const shouldRender = Boolean(ADSENSE_PUBLISHER_ID) && Boolean(ADSENSE_RESULT_AD_SLOT) && consent === "accepted";

  useEffect(() => {
    if (!shouldRender) return;
    try {
      const w = window as typeof window & { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // Falha ao solicitar o anúncio (ex.: bloqueador de anúncios instalado)
      // não deve quebrar a página — o espaço reservado simplesmente fica vazio.
    }
    // Executa só quando a montagem passa a valer (consentimento aceito) —
    // não deve repetir o `push` em toda renderização.
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      data-testid="result-ad-slot"
      className="w-full flex flex-col items-center gap-2 mt-10 pt-8 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]"
    >
      <span className="font-medium text-[11px] leading-[1.45] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">
        Publicidade
      </span>
      {/* Altura reservada via `aspect-ratio` no próprio contêiner: existe no
          mesmo commit em que o `<ins>` é montado, então o espaço já está
          alocado antes do script do AdSense pintar qualquer criativo — não
          há segundo layout/reflow quando o anúncio carrega. */}
      <div
        data-testid="result-ad-slot-frame"
        className="w-full max-w-[336px]"
        style={{ aspectRatio: "336 / 280" }}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={ADSENSE_RESULT_AD_SLOT}
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        />
      </div>
    </div>
  );
}
