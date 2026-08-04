import type { Metadata } from 'next'
import Link from 'next/link'
import { DocPage } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'
import { ComparisonMatrix, type ComparisonColumn, type ComparisonRow } from '../../components/ComparisonMatrix'
import { PAGE_META } from '../../lib/pageMetaCatalog'
import { routeMetadata } from '../../lib/routeMetadata'

export const metadata: Metadata = routeMetadata(PAGE_META['/comparativo'])

// Matriz visual (issue #63), especificação de Juliana (Head de Product
// Design) — substitui a prosa de 5 seções que existia antes desta issue.
// Cada linha/nota abaixo tem evidência verificada em código ou em conteúdo
// já publicado no site (ver notas por célula); onde não há evidência de uma
// capacidade Android, a coluna recebe "Não" em vez de presumir presença
// (regra de conservadorismo da especificação).
const COLUMNS: ComparisonColumn[] = [
  {
    id: 'traditional',
    label: 'Teste tradicional',
    headerNote: {
      summary: 'O que é "teste tradicional"?',
      content: (
        <p>
          Representa a categoria de testes de velocidade genéricos — o tipo mais comum, focado em
          mostrar Mbps de download e upload. Não é uma comparação contra uma ferramenta específica:
          cada ferramenta da categoria varia nos recursos que oferece, por isso vários itens aparecem
          como &quot;Varia por ferramenta&quot; em vez de um &quot;Não&quot; definitivo para todo o mercado.
        </p>
      ),
    },
  },
  { id: 'web', label: 'SignallQ Web/PWA' },
  { id: 'android', label: 'SignallQ Android' },
]

const ROWS: ComparisonRow[] = [
  {
    capability: 'Download e upload',
    cells: [{ state: 'yes' }, { state: 'yes' }, { state: 'yes' }],
  },
  {
    capability: 'Latência (repouso)',
    cells: [{ state: 'yes' }, { state: 'yes' }, { state: 'yes' }],
  },
  {
    capability: 'Latência sob carga (bufferbloat)',
    cells: [
      { state: 'varies' },
      { state: 'yes' },
      {
        state: 'no',
        note: {
          summary: 'Ainda em confirmação',
          content: (
            <p>
              Não aparece na lista de diferenciais hoje publicada do app Android. Isso não prova
              ausência, só falta de confirmação do time Android — tratamos como &quot;Não&quot; até
              essa confirmação existir.
            </p>
          ),
        },
      },
    ],
  },
  {
    capability: 'Tempo de resposta DNS',
    cells: [
      { state: 'varies' },
      {
        state: 'browser-limited',
        note: {
          summary: 'Por que "limitado no navegador"?',
          content: (
            <p>
              O navegador não acessa consulta DNS bruta (porta 53). Medimos o tempo de resposta de
              resolvedores públicos via DNS-over-HTTPS (Cloudflare e Google) — não é latência DNS
              pura. <Link href="/como-medimos" className="text-[color:var(--accent)] hover:underline">Entender como medimos →</Link>
            </p>
          ),
        },
      },
      {
        state: 'no',
        note: {
          summary: 'Sem evidência',
          content: <p>Nenhum recurso de medição de DNS foi encontrado no app publicado até o momento.</p>,
        },
      },
    ],
  },
  {
    capability: 'Histórico local',
    cells: [
      { state: 'varies' },
      { state: 'yes' },
      {
        state: 'yes',
        note: {
          summary: 'Fonte: matriz de privacidade',
          content: (
            <p>
              A <Link href="/privacidade/matriz" className="text-[color:var(--accent)] hover:underline">matriz de privacidade</Link> já
              publicada cita o histórico de medições salvo no app via Room.
            </p>
          ),
        },
      },
    ],
  },
  {
    capability: 'Contexto do problema (perguntas guiadas)',
    cells: [
      { state: 'varies' },
      { state: 'yes' },
      {
        state: 'yes',
        note: {
          summary: 'Mecanismo diferente do Web',
          content: (
            <p>
              O app descreve o problema por texto livre e usa diagnóstico por IA — um mecanismo
              diferente do fluxo de perguntas estruturadas do Web, não o mesmo motor.
            </p>
          ),
        },
      },
    ],
  },
  {
    capability: 'Diagnóstico (causa provável)',
    cells: [
      { state: 'varies' },
      { state: 'yes' },
      {
        state: 'yes',
        note: {
          summary: 'Mecanismo diferente do Web',
          content: (
            <p>
              O diagnóstico do app usa IA a partir de descrição em texto livre; o Web usa regras
              determinísticas sobre métricas classificadas — mecanismos diferentes, não equivalentes.
            </p>
          ),
        },
      },
    ],
  },
  {
    capability: 'Próxima ação / reteste comparativo',
    cells: [
      { state: 'varies' },
      { state: 'yes' },
      {
        state: 'no',
        note: {
          summary: 'Ainda em confirmação',
          content: (
            <p>Sem evidência de código nem de publicação equivalente no app até o momento.</p>
          ),
        },
      },
    ],
  },
  {
    capability: 'Sinal Wi-Fi por cômodo',
    cells: [{ state: 'no' }, { state: 'no' }, { state: 'android-only' }],
  },
  {
    capability: 'Sinal móvel 4G/5G (RSRP/RSRQ/SINR)',
    cells: [{ state: 'no' }, { state: 'no' }, { state: 'android-only' }],
  },
  {
    capability: 'Dispositivos na rede',
    cells: [{ state: 'no' }, { state: 'no' }, { state: 'android-only' }],
  },
]

function ComparativoCtas() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/"
        className="label-large flex h-10 items-center justify-center rounded-[var(--radius-button)] px-5 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        Testar agora no navegador
      </Link>
      <Link
        href="/app"
        className="label-large flex h-10 items-center justify-center rounded-[var(--radius-button)] border px-5 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        Conhecer o app Android
      </Link>
      <Link
        href="/como-medimos"
        className="label-large flex h-10 items-center justify-center rounded-[var(--radius-button)] border px-5 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        Entender como medimos
      </Link>
    </div>
  )
}

export default function Page() {
  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Comparativo"
        title="SignallQ x testes de velocidade tradicionais"
        intro="Um número de Mbps não diz por que a internet trava. Veja abaixo, item a item, o que cada tipo de teste realmente mede."
        sections={[]}
        ctaLabel="Fazer meu teste"
        ctaTo="/"
      >
        <div className="flex flex-col gap-5">
          <p className="body-medium m-0 text-pretty">
            A maioria dos testes tradicionais mostra só download e upload soltos. O SignallQ
            classifica cada métrica e, em vez de parar no número, aponta uma causa provável e o que
            fazer a seguir.
          </p>
          <ComparisonMatrix caption="Comparação entre teste tradicional, SignallQ Web/PWA e SignallQ Android" columns={COLUMNS} rows={ROWS} />
          <ComparativoCtas />
        </div>
      </DocPage>
    </PageShell>
  )
}
