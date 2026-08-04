// Catálogo único de metadados por rota — consumido tanto pelo cliente
// (useDocumentMeta, upsert pós-hidratação) quanto por `functions/_middleware.ts`
// (injeção no HTML inicial via HTMLRewriter, issue #1369 Fase 2). Uma só fonte
// de verdade: mudar o title/description de uma rota aqui já reflete nos dois.
import type { PageMeta } from './seo'

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Teste de velocidade real — SignallQ',
    description:
      'Meça agora a velocidade real da sua internet: download, upload e latência, com veredito claro para navegação, streaming, videochamadas e jogos.',
    path: '/',
  },
  '/historico': {
    title: 'Histórico de medições — SignallQ',
    description: 'Veja o histórico local das suas medições de velocidade. Armazenado somente neste navegador.',
    path: '/historico',
    robots: 'noindex,follow',
  },
  '/historico/[id]': {
    title: 'Teste salvo — Histórico — SignallQ',
    description: 'Detalhe de um teste de velocidade salvo neste navegador.',
    // Canonical aponta para a rota-mãe: o conteúdo depende de dado local
    // (IndexedDB), não existe URL pública indexável por id.
    path: '/historico',
    robots: 'noindex,follow',
  },
  '/historico/comparar': {
    title: 'Comparar testes — Histórico — SignallQ',
    description: 'Compare duas medições salvas do histórico local deste navegador.',
    // Mesma razão do detalhe: conteúdo depende de dois ids de dado local,
    // não existe URL pública indexável.
    path: '/historico',
    robots: 'noindex,follow',
  },
  '/como-medimos': {
    title: 'Como medimos sua conexão — SignallQ',
    description: 'Entenda como o teste web do SignallQ mede velocidade, latência e estabilidade, além dos limites naturais do navegador.',
    path: '/como-medimos',
  },
  '/sobre': {
    title: 'Sobre o SignallQ',
    description: 'Conheça o SignallQ: por que existe, o que faz na Web e no Android, e quem mantém o produto.',
    path: '/sobre',
  },
  '/privacidade': {
    title: 'Política de Privacidade — SignallQ',
    description: 'Política única do SignallQ: dados tratados no Android e na Web/PWA, armazenamento local, serviços externos e seus direitos.',
    path: '/privacidade',
  },
  '/privacidade/matriz': {
    title: 'Matriz de Privacidade — SignallQ',
    description: 'Resumo leigo e matriz detalhada do tratamento de dados por plataforma (Android e Web/PWA).',
    path: '/privacidade/matriz',
  },
  '/termos': {
    title: 'Termos de Uso — SignallQ',
    description: 'Termos de uso do site público do SignallQ: teste de velocidade, histórico local e conteúdo institucional.',
    path: '/termos',
  },
  '/internet-boa-mas-travando': {
    title: 'Internet boa mas travando? Entenda o bufferbloat — SignallQ',
    description:
      'Sinal Wi-Fi forte e velocidade boa no teste, mas a internet trava quando mais de uma coisa usa a rede? Entenda o bufferbloat, a causa mais comum, e o que fazer.',
    path: '/internet-boa-mas-travando',
  },
  '/lag-em-jogos-online': {
    title: 'Lag em jogos online com boa internet? Pode ser CGNAT — SignallQ',
    description:
      'Internet parece boa mas dá lag em jogos, e você não consegue hospedar partida ou conectar direto com amigos? Entenda o CGNAT e o NAT Strict, e o que fazer.',
    path: '/lag-em-jogos-online',
  },
  '/comparativo': {
    // Rascunho de #63 (Juliana) pendente de validação final com Marcos
    // (growth/SEO editorial), coordenado com #55/#58/#61.
    title: 'SignallQ x teste de velocidade tradicional: comparativo',
    description: 'Matriz comparativa entre o SignallQ e testes de velocidade tradicionais: download, upload, latência sob carga e diagnóstico, item a item.',
    path: '/comparativo',
  },
  '/internet-para-jogos': {
    title: 'Que internet você precisa para jogar online sem travar',
    description: 'Não é só velocidade: latência baixa e estável importa mais que Mbps para a maioria dos jogos competitivos.',
    path: '/internet-para-jogos',
  },
  '/app': {
    title: 'App SignallQ',
    description: 'O app que não para no número: aponta causas prováveis da sua internet ruim. Em teste fechado.',
    path: '/app',
  },
  // /velocidade-e-latencia e /latencia-sob-carga foram eliminadas (#97): a
  // jornada real já existe no fluxo de teste principal e nos detalhes
  // técnicos do resultado completo — ver redirects em `next.config.ts`.
  // #98 — /servidores-dns virou /dns: ferramenta real de comparação de
  // resolvedores DNS via DoH, chip "Servidores DNS" da Home aponta pra cá.
  '/dns': {
    title: 'Comparar servidores DNS — SignallQ',
    description: 'Compare o tempo de resposta dos resolvedores DNS públicos da Cloudflare e do Google direto do seu navegador.',
    path: '/dns',
  },
  // #99 — /modo-gamer virou /jogos: medição real de latência até
  // infraestrutura pública de Steam, Riot Games e Xbox Live, chip "Modo
  // gamer" da Home aponta pra cá.
  '/jogos': {
    title: 'Latência até servidores de jogos — SignallQ',
    description: 'Meça o tempo de resposta até a infraestrutura pública da Steam, Riot Games e Xbox Live direto do seu navegador.',
    path: '/jogos',
  },
}

export const NOT_FOUND_META: PageMeta = {
  title: 'Página não encontrada — SignallQ',
  description: 'A página que você acessou não existe ou foi movida.',
  path: '/404',
  robots: 'noindex,follow',
}
