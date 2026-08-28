// Catálogo único de metadados por rota — consumido tanto pelo cliente
// (useDocumentMeta, upsert pós-hidratação) quanto por `functions/_middleware.ts`
// (injeção no HTML inicial via HTMLRewriter, issue #1369 Fase 2). Uma só fonte
// de verdade: mudar o title/description de uma rota aqui já reflete nos dois.
import type { PageMeta } from './seo'

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'SignallQ — o app que descobre por que sua internet está ruim',
    description: 'O app que não para no número: aponta causas prováveis da sua internet ruim. Wi-Fi cômodo a cômodo, sinal 4G/5G real e diagnóstico por IA. Baixe na Play Store.',
    path: '/',
  },
  '/privacidade': {
    title: 'Política de Privacidade — SignallQ',
    description: 'Política de privacidade do SignallQ: dados tratados pelo app Android, armazenamento e seus direitos.',
    path: '/privacidade',
  },
  '/termos': {
    title: 'Termos de Uso — SignallQ',
    description: 'Termos de uso do aplicativo SignallQ.',
    path: '/termos',
  },
}

export const NOT_FOUND_META: PageMeta = {
  title: 'Página não encontrada — SignallQ',
  description: 'A página que você acessou não existe ou foi movida.',
  path: '/404',
  robots: 'noindex,follow',
}
