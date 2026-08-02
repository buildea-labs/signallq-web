// Vocabulário de fases do painel de medição e tradução de erro do motor para
// estado visual. Módulo puro (sem React) — consumido pelo controller do hook e
// pelos componentes da Home.
import { SpeedTestError, type SpeedTestPhase, type SpeedTestResult } from './speedEngine'

// Estados de problema em PT-BR — mapeados explicitamente a partir do código
// de erro real do motor (SpeedTestError.code). O protótipo original tinha um
// bug aqui: usava o `err.code` em inglês como chave de estado, mas o mapa de
// mensagens só tinha chaves em português — todo erro de rede real caía no
// fallback genérico "Erro inesperado", perdendo a mensagem específica
// (sem-conexão, conexão interrompida, endpoint indisponível). Corrigido nesta
// versão com o mapeamento abaixo.
export type ProblemPhase = 'sem-conexao' | 'conexao-interrompida' | 'endpoint-indisponivel' | 'erro-inesperado' | 'cancelado' | 'bloqueado-outra-aba'

// 'idle' é o estado inicial real desde o redesign do PWA (protótipo "SignallQ
// WebApp.dc.html" do Luiz, GH#1186) — o teste deixou de disparar sozinho ao
// abrir a tela; só começa quando o usuário toca em "Iniciar teste".
export type FasePainel = SpeedTestPhase | 'idle' | 'concluido' | 'parcial' | 'inconclusivo' | 'contaminado' | ProblemPhase

const CODE_TO_PROBLEM_PHASE: Record<string, ProblemPhase> = {
  'no-connection': 'sem-conexao',
  'connection-interrupted': 'conexao-interrompida',
  'endpoint-unavailable': 'endpoint-indisponivel',
  'unexpected-error': 'erro-inesperado',
  cancelled: 'cancelado',
}

// Fases em que o motor está de fato medindo — usadas para decidir se um evento
// de ciclo de vida (aba escondida) deve cancelar a medição em andamento.
export const RUNNING_PHASES: FasePainel[] = ['preparando', 'latencia', 'download', 'upload', 'processando']

// Fases cujo valor ao vivo vira um resultado parcial fixado ao trocar de etapa.
export const STEP_PHASES: FasePainel[] = ['latencia', 'download', 'upload']

// Resultado parcial fixado por fase (latência/download/upload) enquanto a
// medição está em andamento — irmão de tipo de FasePainel/ProblemPhase, por
// isso vive no mesmo módulo puro em vez do módulo do hook.
export interface PhaseResults {
  latencia?: number
  download?: number
  upload?: number
}

export function problemPhaseFromError(err: unknown): ProblemPhase {
  const code = err instanceof SpeedTestError ? err.code : 'unexpected-error'
  return CODE_TO_PROBLEM_PHASE[code] ?? 'erro-inesperado'
}

// Qualquer status fora de complete/partial/inconclusive cai em 'contaminado' —
// mesmo encadeamento do hook original, preservado na íntegra.
export function phaseFromResultStatus(status: SpeedTestResult['status']): FasePainel {
  return status === 'complete'
    ? 'concluido'
    : status === 'partial'
      ? 'parcial'
      : status === 'inconclusive'
        ? 'inconclusivo'
        : 'contaminado'
}
