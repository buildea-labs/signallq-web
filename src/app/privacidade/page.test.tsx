import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './page'

describe('privacy policy', () => {
  it('keeps one canonical policy with an accessible platform selector and essential rights', () => {
    const markup = renderToStaticMarkup(<PrivacyPage />)
    expect(markup).toContain('aria-label="Selecionar plataforma"')
    expect(markup).toContain('aria-pressed="true"')
    expect(markup).toContain('Seus direitos e como falar conosco')
    expect(markup).toContain('suporte@signallq.com')
  })

  it('documents the initial platform and a no-JavaScript fallback', () => {
    const markup = renderToStaticMarkup(<PrivacyPage />)
    expect(markup).toContain('No aplicativo Android')
    expect(markup).toContain('<noscript>')
    expect(markup).toContain('No site e na PWA')
  })
})
