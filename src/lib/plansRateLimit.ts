// Instâncias de rate limit para as 3 rotas de `/api/planos/*`. Vivem fora
// dos arquivos `route.ts` de propósito: o Next.js 16 valida em modo dev que
// um Route Handler só exporta os nomes reconhecidos (GET/POST/config/...) —
// exportar a instância do limiter diretamente do `route.ts` quebra
// `tsc --noEmit` assim que a rota é visitada em dev (`.next/dev/types`).
import { FixedWindowRateLimiter } from './diagnosticProxy'

export const locationRequestLimiter = new FixedWindowRateLimiter(30, 60_000)
export const offersRequestLimiter = new FixedWindowRateLimiter(30, 60_000)
export const recommendationsRequestLimiter = new FixedWindowRateLimiter(20, 60_000)
