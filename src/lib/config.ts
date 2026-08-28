// Configuração central do site público SignallQ.
// Nenhum valor sensível é exposto aqui além de identificadores públicos
// (publisher id do AdSense) — nada de segredos (INGEST_KEY nunca entra aqui,
// vive só no Pages Function server-side, ver functions/api/track.ts).
//
// `process.env.NEXT_PUBLIC_*` permite configurar por ambiente sem editar código
// (ex.: variável de ambiente do projeto na Vercel) — sem override, os defaults
// abaixo mandam o site mostrar estados claros de "ainda não configurado" em vez
// de link quebrado ou anúncio vazio.

// Ficha pública do app na Play Store — destino do CTA de download da landing.
export const SIGNALLQ_PLAY_STORE_URL: string =
  process.env.NEXT_PUBLIC_SIGNALLQ_PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=io.signallq.app'

// Proxy server-side de telemetria (Pages Function) — nunca chama o admin-worker
// direto do navegador (exigiria expor a INGEST_KEY no client).
export const TELEMETRY_ENDPOINT = '/api/track'

