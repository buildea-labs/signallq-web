import { SITE_ORIGIN } from './routeMetadata'

export interface ShareMeasurement {
  timestamp: number
  downloadMbps: number
  uploadMbps: number
  latencyMs: number
  conclusion?: string
  nextAction?: string
}

export type ShareOutcome = 'shared' | 'copied' | 'manual-copy' | 'cancelled'
export type CopyOutcome = 'copied' | 'manual-copy'

/** Text is intentionally limited to metrics; local-history fields never leave the device. */
export function formatMeasurementShare(measurement: ShareMeasurement, canonicalUrl = `${SITE_ORIGIN}/`): string {
  const when = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(measurement.timestamp))
  const diagnostic = measurement.conclusion && measurement.nextAction
    ? ` Conclusão: ${measurement.conclusion} Próxima ação: ${measurement.nextAction}`
    : ''
  return `Meu teste de velocidade SignallQ (${when}): Download ${measurement.downloadMbps.toFixed(1)} Mbps · Upload ${measurement.uploadMbps.toFixed(1)} Mbps · Latência ${Math.round(measurement.latencyMs)} ms.${diagnostic} Teste a sua em ${canonicalUrl}`
}

function wasCancelled(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function shareMeasurement(measurement: ShareMeasurement): Promise<ShareOutcome> {
  const canonicalUrl = `${SITE_ORIGIN}/`
  const text = formatMeasurementShare(measurement, canonicalUrl)
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Meu teste de velocidade SignallQ', text, url: canonicalUrl })
      return 'shared'
    } catch (error) {
      if (wasCancelled(error)) return 'cancelled'
    }
  }
  return copyMeasurement(measurement)
}

/** Explicit copy never opens the native share sheet. */
export async function copyMeasurement(measurement: ShareMeasurement): Promise<CopyOutcome> {
  const text = formatMeasurementShare(measurement)
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    window.prompt('Copie o resumo abaixo:', text)
    return 'manual-copy'
  }
}
