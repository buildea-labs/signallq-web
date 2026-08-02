// Comparação de resolvedores DNS públicos a partir do navegador (issue #98).
//
// Limitação técnica: não existe Web API para consulta DNS raw (UDP/porta 53)
// nem para medir round-trip contra um resolvedor IP arbitrário — isso é
// invisível para JavaScript de browser. A única via viável é DoH
// (DNS-over-HTTPS): Cloudflare e Google expõem um endpoint HTTP/JSON que
// aceita `fetch` de origem externa (CORS `Access-Control-Allow-Origin: *`,
// confirmado em 2026-08-02). Por isso o tempo medido aqui é "tempo de
// resposta" (HTTP/TLS + resolução), não latência DNS pura — nunca chamamos
// isso de "latência DNS" na UI.
//
// Quad9 foi avaliado e descartado: o endpoint JSON documentado
// (`dns.quad9.net:5053/dns-query`) não respondeu (timeout) no teste manual —
// sem API JSON compatível publicamente alcançável, não faz parte da
// comparação.
//
// Não medimos o "resolvedor do usuário/ISP" — isso é definido pelo sistema
// operacional/roteador e é invisível para JS. Comparamos apenas resolvedores
// públicos que dá para medir de verdade.
//
// Cada execução usa um subdomínio aleatório de signallq.com como alvo da
// consulta (nunca visto antes por nenhum dos dois resolvedores), para evitar
// que uma resposta em cache mascare o tempo real. O domínio não tem registro
// configurado, então a resposta esperada é NXDOMAIN — o que ainda assim força
// o resolvedor a completar a resolução recursiva até a autoridade.

export interface ResolverDefinition {
  id: 'cloudflare' | 'google'
  label: string
  resolverAddress: string
  buildUrl: (host: string) => string
  headers?: Record<string, string>
}

export const DNS_RESOLVERS: ResolverDefinition[] = [
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    resolverAddress: '1.1.1.1',
    buildUrl: (host) => `https://cloudflare-dns.com/dns-query?name=${host}&type=A`,
    headers: { accept: 'application/dns-json' },
  },
  {
    id: 'google',
    label: 'Google',
    resolverAddress: '8.8.8.8',
    buildUrl: (host) => `https://dns.google/resolve?name=${host}&type=A`,
  },
]

export interface ResolverResult {
  id: ResolverDefinition['id']
  label: string
  resolverAddress: string
  responseTimeMs: number | null
  status: 'ok' | 'timeout' | 'error'
  /** Status DNS cru da resposta (0 = NOERROR, 3 = NXDOMAIN) — não exibido como sucesso/falha, só contexto. */
  dnsStatus: number | null
}

interface DnsJsonResponse {
  Status?: number
}

function randomTestHost(): string {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  return `${token}.signallq.com`
}

async function measureResolver(definition: ResolverDefinition, host: string): Promise<ResolverResult> {
  const startedAt = performance.now()
  try {
    const response = await fetch(definition.buildUrl(host), {
      headers: definition.headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const responseTimeMs = Math.round(performance.now() - startedAt)
    if (!response.ok) {
      return { id: definition.id, label: definition.label, resolverAddress: definition.resolverAddress, responseTimeMs, status: 'error', dnsStatus: null }
    }
    const body = (await response.json()) as DnsJsonResponse
    return { id: definition.id, label: definition.label, resolverAddress: definition.resolverAddress, responseTimeMs, status: 'ok', dnsStatus: body.Status ?? null }
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    return { id: definition.id, label: definition.label, resolverAddress: definition.resolverAddress, responseTimeMs: null, status: timedOut ? 'timeout' : 'error', dnsStatus: null }
  }
}

export async function compareDnsResolvers(): Promise<ResolverResult[]> {
  const host = randomTestHost()
  return Promise.all(DNS_RESOLVERS.map((definition) => measureResolver(definition, host)))
}
