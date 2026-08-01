/**
 * Contexto declarado pelo visitante antes da medição.
 *
 * Isto não é uma classificação nem uma entrada do contrato de diagnóstico.
 * A fronteira local versionada que o acompanha é `MeasurementSessionContext`;
 * o contrato oficial só poderá recebê-lo quando Android/Worker documentarem
 * o atributo correspondente.
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
