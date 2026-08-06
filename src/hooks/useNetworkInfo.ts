"use client";

import { useState, useEffect } from "react";

export interface NetworkInfo {
  isp: string | null;
  region: string | null;
  loading: boolean;
}

const VAZIO: NetworkInfo = { isp: null, region: null, loading: false };

/**
 * Uma consulta por carregamento de página, compartilhada por todos os
 * consumidores.
 *
 * `ipapi.co` é serviço de terceiro com limite diário. Antes, cada componente
 * que chamava este hook abria a sua própria requisição: na tela de resultado
 * completo, `QuickResult` e `CompleteDiagnosis` renderizam juntos e faziam
 * duas chamadas para o mesmo dado. O resultado (e a promessa em voo) vive no
 * módulo, então o segundo consumidor reaproveita em vez de disparar de novo.
 */
let cache: NetworkInfo | null = null;
let emVoo: Promise<NetworkInfo> | null = null;

async function consultar(): Promise<NetworkInfo> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return {
      isp: data.org || data.asn || null,
      region: data.city && data.region ? `${data.city}, ${data.region}` : data.country_name || null,
      loading: false,
    };
  } catch {
    // Falha ou indisponibilidade real: `null`, nunca um placeholder de texto —
    // quem consome decide se omite a linha (#71 §3.1/§3.4.8).
    return VAZIO;
  }
}

function obter(): Promise<NetworkInfo> {
  if (cache) return Promise.resolve(cache);
  if (!emVoo) {
    emVoo = consultar().then((info) => {
      cache = info;
      emVoo = null;
      return info;
    });
  }
  return emVoo;
}

/** Só para testes: descarta o que já foi consultado nesta página. */
export function resetNetworkInfoCache() {
  cache = null;
  emVoo = null;
}

export function useNetworkInfo(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>(() => cache ?? { isp: null, region: null, loading: true });

  useEffect(() => {
    let ativo = true;
    void obter().then((resultado) => {
      if (ativo) setInfo(resultado);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return info;
}
