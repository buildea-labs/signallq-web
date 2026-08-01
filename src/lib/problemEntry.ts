/**
 * Contexto declarado pelo visitante antes da medição.
 *
 * Isto não é uma classificação nem uma entrada do contrato de diagnóstico:
 * a versão atual do contrato oficial não possui um campo para esse dado. Ele
 * permanece no cliente para sustentar a jornada e só poderá ser encaminhado
 * quando o Worker/Android documentarem o atributo correspondente.
 */
export const PROBLEMAS_PERCEBIDOS = [
  { value: 'lenta', label: 'Está lenta' },
  { value: 'travando', label: 'Está travando' },
  { value: 'cai-com-frequencia', label: 'Cai com frequência' },
  { value: 'wifi-nao-chega-bem', label: 'O Wi-Fi não chega bem' },
  { value: 'jogos-ou-chamadas-ruins', label: 'Jogos ou chamadas estão ruins' },
] as const

export type ProblemaPercebido = (typeof PROBLEMAS_PERCEBIDOS)[number]['value']

export function isProblemaPercebido(value: string): value is ProblemaPercebido {
  return PROBLEMAS_PERCEBIDOS.some((problema) => problema.value === value)
}
