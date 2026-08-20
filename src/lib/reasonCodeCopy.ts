// Traduz `reasonCodes` (tokens de domínio do `signallq-plans`) para copy
// humana, curta e coerente com o tom SignallQ — Issue #10, seção "Reason
// codes e copy". Só o exemplo conceitual documentado na issue é conhecido
// hoje (`download_within_ideal_range`); o dicionário completo depende da
// engine v1 (#9), ainda aberta. Um código desconhecido NUNCA é interpretado
// de forma inventada — cai no fallback neutro abaixo.
const REASON_CODE_COPY: Record<string, string> = {
  download_within_ideal_range: 'Dentro da faixa que faz sentido para sua casa',
}

const FALLBACK_COPY = 'Compatível com o perfil informado'

export function reasonCodeToCopy(code: string): string {
  return REASON_CODE_COPY[code] ?? FALLBACK_COPY
}

export function reasonCodesToCopy(codes: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const code of codes) {
    const copy = reasonCodeToCopy(code)
    if (seen.has(copy)) continue
    seen.add(copy)
    result.push(copy)
  }
  return result
}
