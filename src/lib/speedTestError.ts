// Erro tipado do motor de medição — módulo próprio para evitar import
// circular entre `speedEngine.ts` (monta o resultado) e `speedTestTransport.ts`
// (lança o erro durante a requisição XHR).
export type SpeedTestErrorCode = 'no-connection' | 'connection-interrupted' | 'endpoint-unavailable' | 'cancelled' | 'unexpected-error'

export class SpeedTestError extends Error {
  constructor(public code: SpeedTestErrorCode, message: string = code) {
    super(message)
  }
}
