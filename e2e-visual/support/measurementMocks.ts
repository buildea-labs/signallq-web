/**
 * Adaptador exclusivo de teste para a baseline visual da Home.
 *
 * Vive fora de `src/` de propósito: nada aqui pode entrar no grafo de módulos
 * da aplicação nem no bundle público. Não existe rota de harness, não existe
 * componente de depuração e a Home exercitada é a Home real — o único ponto de
 * controle é a borda de rede do navegador, interceptada pelo Playwright, mais
 * o `sessionStorage` que a própria jornada já lê em produção.
 *
 * O motor de medição (`speedEngine` -> `speedTestTransport`) fala com quatro
 * origens externas; interceptando as quatro, o mesmo motor real roda com
 * transporte previsível, em segundos, sem tráfego de rede de verdade.
 */
import type { Page, Route } from '@playwright/test'
import { SPEEDTEST_DOWNLOAD_URL, SPEEDTEST_LATENCY_URL, SPEEDTEST_UPLOAD_URL } from '../../src/lib/config'

/** Origem consultada por `measureDns()` em `speedTestTransport.ts`. */
const DNS_QUERY_URL = 'https://cloudflare-dns.com/dns-query'
/** Origem consultada por `useNetworkInfo()` — some da tela se falhar, então é fixada aqui. */
const IP_INFO_URL = 'https://ipapi.co/json/'

/**
 * Corpo fixo de download. Menor que o payload pedido pelo motor (10/25 MB) de
 * propósito: o motor mede os bytes que realmente chegam, então um corpo menor
 * só significa mais requisições no mesmo orçamento de tempo — a fase continua
 * durando o que `speedTestConfig` manda, sem gerar centenas de MB por teste.
 */
const DOWNLOAD_CHUNK_BYTES = 512 * 1024
const DOWNLOAD_CHUNK = Buffer.alloc(DOWNLOAD_CHUNK_BYTES, 7)

/** Latência simulada por requisição, para o número na tela ficar estável. */
const LATENCY_MS = 20

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': '*',
  'cache-control': 'no-store',
}

export interface MeasurementMockOptions {
  /**
   * Simula ausência de internet real: a checagem ativa de rede
   * (`useEstadoRede.verificarInternet`, que faz GET no endpoint de download)
   * falha e a jornada entra em `sem-conexao` antes de medir qualquer coisa.
   */
  offline?: boolean
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function startsWith(prefix: string) {
  return (url: URL) => url.href.startsWith(prefix)
}

async function fulfillPreflight(route: Route): Promise<boolean> {
  if (route.request().method() !== 'OPTIONS') return false
  await route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' })
  return true
}

/**
 * Instala a interceptação das quatro origens externas do motor. Deve ser
 * chamada antes do primeiro `page.goto`, porque o autostart da Home dispara a
 * medição já no carregamento.
 */
export async function mockMeasurementNetwork(page: Page, options: MeasurementMockOptions = {}) {
  await page.route(startsWith(SPEEDTEST_LATENCY_URL), async (route) => {
    if (await fulfillPreflight(route)) return
    await delay(LATENCY_MS)
    await route.fulfill({ status: 200, headers: CORS_HEADERS, body: 'pong' })
  })

  await page.route(startsWith(SPEEDTEST_DOWNLOAD_URL), async (route) => {
    if (await fulfillPreflight(route)) return
    if (options.offline) {
      await route.abort('internetdisconnected')
      return
    }
    // `bytes=0` é a sonda de checagem ativa de internet, não uma medição.
    const probeOnly = new URL(route.request().url()).searchParams.get('bytes') === '0'
    await delay(LATENCY_MS)
    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/octet-stream' },
      body: probeOnly ? Buffer.alloc(0) : DOWNLOAD_CHUNK,
    })
  })

  await page.route(startsWith(SPEEDTEST_UPLOAD_URL), async (route) => {
    if (await fulfillPreflight(route)) return
    await delay(LATENCY_MS)
    await route.fulfill({ status: 200, headers: CORS_HEADERS, body: '' })
  })

  await page.route(startsWith(DNS_QUERY_URL), async (route) => {
    if (await fulfillPreflight(route)) return
    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/dns-json' },
      body: JSON.stringify({ Answer: [{ data: '"1.1.1.1"' }] }),
    })
  })

  await page.route(startsWith(IP_INFO_URL), async (route) => {
    if (await fulfillPreflight(route)) return
    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ org: 'Provedor de teste', city: 'Cidade', region: 'Estado' }),
    })
  })
}

/**
 * Chaves reais lidas por `speedTestJourneySession.ts`. A baseline semeia o
 * `sessionStorage` exatamente como a própria aplicação o grava — nenhum canal
 * de teste extra é adicionado ao código de produção.
 */
export interface SessionSeed {
  /** Resultado completo restaurável (estado `restored-result`). */
  restorableResult?: unknown
}

export async function seedJourneySession(page: Page, seed: SessionSeed) {
  await page.addInitScript((value: SessionSeed) => {
    if (value.restorableResult) {
      sessionStorage.setItem('signallq_full_last_result_v1', JSON.stringify(value.restorableResult))
    }
  }, seed)
}
