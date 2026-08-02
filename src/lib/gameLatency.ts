// Medição de latência HTTP contra infraestrutura pública de empresas de
// jogos (issue #99). Substitui o placeholder morto `/modo-gamer`.
//
// Limitação técnica: JavaScript de browser não tem API para ping ICMP nem
// para abrir socket UDP/TCP raw contra o IP de um servidor de jogo
// arbitrário (ex.: o servidor de partida da Riot/Valve) — isso é invisível
// para a Web, do mesmo jeito que consulta DNS raw é (ver `dnsCompare.ts`).
// Não existe "ping até o servidor do CS2/Valorant/etc" real a partir daqui.
//
// A aproximação honesta viável (pesquisada e validada por CORS real em
// 2026-08-02, `curl -H "Origin: https://signallq.com"`): medir o tempo de
// resposta HTTP contra domínios de infraestrutura pública que cada empresa
// realmente controla e expõe com `Access-Control-Allow-Origin: *`.
//
// Critério de inclusão: só entram domínios **de primeira parte** da própria
// empresa (steamstatic.com, leagueoflegends.com, xboxlive.com) — nunca um
// SaaS de status-page de terceiro (ex.: Statuspage.io/Atlassian). Testado e
// descartado: `status.epicgames.com` e `discordstatus.com` respondem com
// CORS aberto, mas ambos são servidos por `AtlassianEdge`/CloudFront do
// Statuspage.io, a mesma infraestrutura compartilhada usada por centenas de
// empresas não relacionadas a jogos — medir isso mediria a CDN da Atlassian,
// não a rede da Epic ou do Discord, e rotular como tal seria enganoso.
// `api.steampowered.com`/`store.steampowered.com` não expõem CORS (sem
// `Access-Control-Allow-Origin`), então não são usáveis por `fetch` legível.
//
// O que medimos de fato, por empresa:
// - Steam/Valve: um asset pequeno do CDN oficial `steamstatic.com`
//   (app 753 = "Steam", não um jogo específico — evita insinuar "latência
//   do CS2/Dota").
// - Riot Games: Data Dragon (`ddragon.leagueoflegends.com`), o CDN oficial
//   de assets de League of Legends/Valorant.
// - Xbox Live/Microsoft: o endpoint real de status de serviço
//   (`xnotify.xboxlive.com`), usado pelo próprio ecossistema Xbox.
//
// Isso é "tempo de resposta até a borda de rede pública dessa empresa", não
// "ping até o servidor de partida" — nunca chamamos de "ping do jogo" ou
// "latência do servidor" na UI. Todas as respostas usam `cache: 'no-store'`
// para não medir cache do navegador.

export interface GameEndpointDefinition {
  id: 'steam' | 'riot' | 'xbox'
  label: string
  company: string
  url: string
}

export const GAME_ENDPOINTS: GameEndpointDefinition[] = [
  {
    id: 'steam',
    label: 'Steam',
    company: 'Valve',
    url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/753/capsule_184x69.jpg',
  },
  {
    id: 'riot',
    label: 'Riot Games',
    company: 'League of Legends / Valorant',
    url: 'https://ddragon.leagueoflegends.com/api/versions.json',
  },
  {
    id: 'xbox',
    label: 'Xbox Live',
    company: 'Microsoft',
    url: 'https://xnotify.xboxlive.com/servicestatusv6/US/en-US',
  },
]

export interface GameLatencyResult {
  id: GameEndpointDefinition['id']
  label: string
  company: string
  responseTimeMs: number | null
  status: 'ok' | 'timeout' | 'error'
}

async function measureEndpoint(definition: GameEndpointDefinition): Promise<GameLatencyResult> {
  const startedAt = performance.now()
  try {
    const response = await fetch(definition.url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const responseTimeMs = Math.round(performance.now() - startedAt)
    return {
      id: definition.id,
      label: definition.label,
      company: definition.company,
      responseTimeMs,
      status: response.ok ? 'ok' : 'error',
    }
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    return {
      id: definition.id,
      label: definition.label,
      company: definition.company,
      responseTimeMs: null,
      status: timedOut ? 'timeout' : 'error',
    }
  }
}

export async function measureGameEndpoints(): Promise<GameLatencyResult[]> {
  return Promise.all(GAME_ENDPOINTS.map((definition) => measureEndpoint(definition)))
}
