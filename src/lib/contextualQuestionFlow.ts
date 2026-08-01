import { MEASUREMENT_SESSION_CONTEXT_VERSION, type MeasurementSessionContext } from './measurementSessionContext'

/**
 * Contrato local temporário para as perguntas do Site/PWA.
 *
 * Só aceita respostas declaradas no navegador. Não representa telemetria de
 * Wi-Fi, fibra, gateway ou sinal e não produz diagnóstico; a versão permite
 * substituir este resolvedor por um adaptador Cloudflare quando o contrato
 * remoto estiver disponível.
 */
export const CONTEXTUAL_QUESTION_FLOW_VERSION = 1 as const

/** `answerId: null` significa que o visitante pulou um campo opcional. */
export type ContextualAnswer = { questionId: string; answerId: string | null }

export type ContextualQuestion = {
  id: string
  text: string
  optional: boolean
  options: ReadonlyArray<{ id: string; label: string }>
}

export type ContextualQuestionFlowState =
  | { status: 'concluded'; version: typeof CONTEXTUAL_QUESTION_FLOW_VERSION; answers: ContextualAnswer[] }
  | { status: 'awaiting_answer'; version: typeof CONTEXTUAL_QUESTION_FLOW_VERSION; question: ContextualQuestion; answers: ContextualAnswer[] }
  | { status: 'invalid_answer'; version: typeof CONTEXTUAL_QUESTION_FLOW_VERSION; question: ContextualQuestion; answers: ContextualAnswer[] }
  | { status: 'insufficient_data'; version: typeof CONTEXTUAL_QUESTION_FLOW_VERSION; answers: ContextualAnswer[] }
  | { status: 'unavailable'; version: typeof CONTEXTUAL_QUESTION_FLOW_VERSION; answers: ContextualAnswer[] }

type Node = { question: ContextualQuestion; next: Record<string, Node | null> }

const lenta: Node = {
  question: {
    id: 'internet_lenta_q1', text: 'Quando a lentidão ocorre?', optional: true,
    options: [
      { id: 'sempre', label: 'Sempre ou o dia todo' },
      { id: 'horarios', label: 'Em horários específicos' },
      { id: 'so_certos_apps', label: 'Só em certos apps ou sites' },
    ],
  },
  next: {
    sempre: {
      question: {
        id: 'internet_lenta_q2a', text: 'Em quais situações você percebe mais?', optional: true,
        options: [
          { id: 'web', label: 'Navegar na web ou redes sociais' },
          { id: 'video', label: 'Assistir vídeo' },
          { id: 'download', label: 'Baixar arquivos grandes' },
          { id: 'tudo', label: 'Em todas as situações' },
        ],
      }, next: { web: null, video: null, download: null, tudo: null },
    },
    horarios: null,
    so_certos_apps: null,
  },
}

const wifi: Node = {
  question: {
    id: 'wifi_q1', text: 'Em qual área da casa o Wi-Fi oscila?', optional: true,
    options: [
      { id: 'proximo', label: 'Perto do roteador' },
      { id: 'longe', label: 'Cômodo distante do roteador' },
      { id: 'toda_casa', label: 'Em toda a casa' },
    ],
  },
  next: {
    proximo: {
      question: {
        id: 'wifi_q2_proximo', text: 'Quando a oscilação acontece?', optional: true,
        options: [
          { id: 'sempre_osc', label: 'Sempre ou constantemente' },
          { id: 'horarios_osc', label: 'Em horários específicos' },
          { id: 'ao_mover', label: 'Ao mover o dispositivo' },
        ],
      }, next: { sempre_osc: null, horarios_osc: null, ao_mover: null },
    },
    longe: {
      question: {
        id: 'wifi_q2_longe', text: 'Qual a distância aproximada do roteador?', optional: true,
        options: [
          { id: 'um_comodo', label: 'Um cômodo de distância' },
          { id: 'dois_comodos', label: 'Dois ou mais cômodos' },
          { id: 'andar', label: 'Em outro andar' },
        ],
      }, next: { um_comodo: null, dois_comodos: null, andar: null },
    },
    toda_casa: null,
  },
}

const quedas: Node = {
  question: {
    id: 'nao_sei_q2_cai', text: 'Com que frequência a internet cai?', optional: true,
    options: [
      { id: 'varias_dia', label: 'Várias vezes ao dia' },
      { id: 'uma_dia', label: 'Uma ou duas vezes ao dia' },
      { id: 'raramente', label: 'Raramente' },
    ],
  }, next: { varias_dia: null, uma_dia: null, raramente: null },
}

const jogosOuChamadas: Node = {
  question: {
    id: 'web_atividade_q1', text: 'Em que atividade você percebe mais o problema?', optional: true,
    options: [{ id: 'jogos', label: 'Jogos online' }, { id: 'chamadas', label: 'Chamadas de vídeo ou voz' }],
  },
  next: {
    jogos: {
      question: {
        id: 'jogos_q1', text: 'Qual dispositivo você usa para jogar?', optional: true,
        options: [{ id: 'console', label: 'Console' }, { id: 'pc', label: 'PC ou computador' }, { id: 'celular', label: 'Celular ou tablet' }],
      }, next: { console: null, pc: null, celular: null },
    },
    chamadas: {
      question: {
        id: 'chamadas_q1', text: 'Que tipo de chamada apresenta problema?', optional: true,
        options: [{ id: 'videochamada', label: 'Videochamada' }, { id: 'voz_voip', label: 'Áudio por aplicativo' }, { id: 'celular_op', label: 'Ligação pela operadora' }],
      }, next: { videochamada: null, voz_voip: null, celular_op: null },
    },
  },
}

const roots = { lenta, travando: lenta, 'cai-com-frequencia': quedas, 'wifi-nao-chega-bem': wifi, 'jogos-ou-chamadas-ruins': jogosOuChamadas } as const

function findNode(root: Node, answers: ContextualAnswer[]): Node | null | 'invalid' {
  let current: Node | null = root
  for (const answer of answers) {
    if (!current || answer.questionId !== current.question.id) return 'invalid'
    if (answer.answerId === null) {
      if (!current.question.optional) return 'invalid'
      current = null
      continue
    }
    if (!Object.hasOwn(current.next, answer.answerId)) return 'invalid'
    current = current.next[answer.answerId]
  }
  return current
}

export function resolveContextualQuestions(
  context: MeasurementSessionContext | null,
  answers: ContextualAnswer[] = [],
): ContextualQuestionFlowState {
  const base = { version: CONTEXTUAL_QUESTION_FLOW_VERSION as typeof CONTEXTUAL_QUESTION_FLOW_VERSION, answers }
  if (!context || context.version !== MEASUREMENT_SESSION_CONTEXT_VERSION) return { status: 'unavailable', ...base }
  if (context.entry === 'direct') return { status: 'concluded', ...base }
  if (!context.declaredProblem) return { status: 'insufficient_data', ...base }
  const node = findNode(roots[context.declaredProblem], answers)
  if (node === 'invalid') {
    const current = findNode(roots[context.declaredProblem], answers.slice(0, -1))
    if (!current || current === 'invalid') return { status: 'insufficient_data', ...base }
    return { status: 'invalid_answer', question: current.question, ...base }
  }
  return node ? { status: 'awaiting_answer', question: node.question, ...base } : { status: 'concluded', ...base }
}
