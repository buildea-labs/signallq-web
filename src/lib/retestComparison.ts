import type { MedicaoRegistro } from './measurementRepository'
import type { SpeedTestMode, SpeedTestResult } from './speedEngine'

export type RetestComparison = {
  compatible: boolean
  reason?: string
  changes?: Array<{ label: string; before: number; after: number; unit: 'Mbps' | 'ms'; direction: 'better' | 'worse' | 'same' }>
}

function change(label: string, before: number, after: number, unit: 'Mbps' | 'ms', lowerIsBetter = false): NonNullable<RetestComparison['changes']>[number] {
  const difference = after - before
  const direction = difference === 0 ? 'same' : (lowerIsBetter ? difference < 0 : difference > 0) ? 'better' : 'worse'
  return { label, before, after, unit, direction }
}

/**
 * Compara somente as medições observadas. Não atribui causa, melhora de rede
 * ou validade diagnóstica: essa decisão pertence ao motor oficial quando ele
 * estiver disponível.
 */
export function compareRetest(before: SpeedTestResult, after: SpeedTestResult): RetestComparison {
  if (before.status !== 'complete' || after.status !== 'complete') {
    return { compatible: false, reason: 'As duas medições precisam estar completas para comparar.' }
  }
  if (before.mode !== after.mode || before.mode === 'triplo' || after.mode === 'triplo') {
    return { compatible: false, reason: 'Repita usando o mesmo modo de teste para comparar.' }
  }
  return {
    compatible: true,
    changes: [
      change('Download', before.download.mbps, after.download.mbps, 'Mbps'),
      change('Upload', before.upload.mbps, after.upload.mbps, 'Mbps'),
      change('Latência', before.latency.ms, after.latency.ms, 'ms', true),
    ],
  }
}

export function comparisonMode(mode: SpeedTestMode): Exclude<SpeedTestMode, 'triplo'> | null {
  return mode === 'rapido' || mode === 'completo' ? mode : null
}

/**
 * Compara dois registros quaisquer do Histórico local (#75), não a jornada ao
 * vivo (`compareRetest` continua servindo essa). `MedicaoRegistro` não tem
 * `status`: todo registro salvo é implicitamente completo (só resultados
 * `complete` são persistidos, ver `persistSpeedTestResult`), então não há
 * checagem equivalente aqui.
 *
 * A ordem dos parâmetros não importa: o registro de timestamp mais antigo
 * sempre vira "antes" e o mais novo "depois", para que clicar dois itens fora
 * de ordem cronológica nunca relate uma mudança invertida.
 */
export function compareHistoryRecords(a: MedicaoRegistro, b: MedicaoRegistro): RetestComparison {
  const [before, after] = a.timestamp <= b.timestamp ? [a, b] : [b, a]

  if (before.mode === undefined || after.mode === undefined) {
    return {
      compatible: false,
      reason: 'Não é possível confirmar que os dois testes usaram o mesmo modo (registro anterior a esta informação).',
    }
  }
  if (before.mode !== after.mode) {
    return { compatible: false, reason: 'Os dois testes precisam usar o mesmo modo.' }
  }

  return {
    compatible: true,
    changes: [
      change('Download', before.download, after.download, 'Mbps'),
      change('Upload', before.upload, after.upload, 'Mbps'),
      change('Latência', before.latency, after.latency, 'ms', true),
    ],
  }
}
