import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Sem publisher id configurado: nunca deve renderizar (comportamento preservado).
describe('AdSenseScript — sem NEXT_PUBLIC_ADSENSE_PUBLISHER_ID', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('não renderiza nenhum script', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_PUBLISHER_ID', '')
    const { AdSenseScript } = await import('./AdSenseScript')
    const markup = renderToStaticMarkup(<AdSenseScript />)
    expect(markup).toBe('')
  })
})

// Com publisher id configurado mas sem decisão de consentimento (estado inicial /
// snapshot de servidor, ver `getAdConsentServerSnapshot`): regressão P0 corrigida
// aqui — antes o componente ignorava o consentimento e só travava na env var.
describe('AdSenseScript — com publisher id, sem consentimento decidido', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('não injeta o script do AdSense antes do aceite do banner de cookies', async () => {
    vi.stubEnv('NEXT_PUBLIC_ADSENSE_PUBLISHER_ID', 'ca-pub-000000000000000')
    const { AdSenseScript } = await import('./AdSenseScript')
    const markup = renderToStaticMarkup(<AdSenseScript />)
    expect(markup).toBe('')
    expect(markup).not.toContain('pagead2.googlesyndication.com')
  })
})
