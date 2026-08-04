// Derivação de `connectionId` ao salvar contexto editado no Histórico —
// extraída de `useHistoryController` (#74) para ser reaproveitada sem
// mudança de comportamento pela tela de detalhe (`HistoryEditDialog` é "o
// mesmo diálogo, sem mudança", inclusive na lógica de agrupamento por nome).
import type { HistoryUserMetadata, MedicaoRegistro } from './measurementRepository'

/**
 * O nome é a chave humana: se já existe uma conexão com este nome, reutiliza
 * o `connectionId` dela. Caso seja um nome novo, deriva uma chave estável a
 * partir dele para que a próxima medição seja agrupada sem depender do id
 * técnico desta medição.
 */
export function resolveConnectionMetadata(
  records: MedicaoRegistro[],
  editingId: string,
  metadata: HistoryUserMetadata,
  selectedConnectionId: string
): HistoryUserMetadata {
  const name = metadata.connectionName?.trim()
  const matching = name
    ? records.find(
        (record) =>
          record.id !== editingId &&
          record.userMetadata?.connectionName?.localeCompare(name, 'pt-BR', { sensitivity: 'accent' }) === 0
      )
    : undefined
  const connectionId =
    selectedConnectionId ||
    matching?.userMetadata?.connectionId ||
    (name
      ? `connection:${name
          .toLocaleLowerCase('pt-BR')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')}`
      : undefined)
  return { ...metadata, connectionId }
}
