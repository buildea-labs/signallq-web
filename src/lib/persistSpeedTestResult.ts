// Gravação do resultado de medição no Histórico. Função pura de infraestrutura
// (sem React) — mantém a tela e o controller sem conhecimento de IndexedDB.
import type { TipoRede } from './connection'
import { addRecord, resultToRecord } from './measurementRepository'
import type { SpeedTestResult } from './speedEngine'

export async function persistSpeedTestResult(result: SpeedTestResult, connectionKind: TipoRede | null): Promise<void> {
  try {
    await addRecord(resultToRecord(result, connectionKind))
  } catch {
    // histórico é best-effort — falha aqui não derruba o resultado exibido
  }
}
