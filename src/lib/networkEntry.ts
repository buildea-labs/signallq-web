/**
 * Rede declarada pela pessoa no sheet "Diagnosticar minha internet"
 * (protótipo, tela 2.1, grupo "Rede").
 *
 * É uma **declaração**, não uma detecção: o navegador não lê tipo de rede de
 * forma confiável (`navigator.connection` não existe no Safari e mente atrás
 * de VPN), então o que o motor detecta continua vivendo em
 * `SpeedTestResult.connectionType` e não substitui isto.
 *
 * Como todo dado declarado antes da medição, entra em
 * `MeasurementSessionContext` — fronteira local e versionada — e não no
 * contrato oficial de diagnóstico enquanto Android/Worker não o definirem.
 */
export const REDES_DECLARADAS = [
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'movel', label: 'Dados móveis' },
  { value: 'outra', label: 'Outra rede' },
] as const

export type RedeDeclarada = (typeof REDES_DECLARADAS)[number]['value']

export function isRedeDeclarada(value: string): value is RedeDeclarada {
  return REDES_DECLARADAS.some((rede) => rede.value === value)
}
