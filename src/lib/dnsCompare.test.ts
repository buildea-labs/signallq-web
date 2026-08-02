import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { compareDnsResolvers } from './dnsCompare'

describe('compareDnsResolvers', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.stubGlobal('crypto', { ...crypto, randomUUID: () => '11111111-1111-1111-1111-111111111111' })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('measures both resolvers against the same freshly-generated host', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('1111111111111111.signallq.com')
      return new Response(JSON.stringify({ Status: 3 }), { status: 200, headers: { 'content-type': 'application/dns-json' } })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const results = await compareDnsResolvers()

    expect(results).toHaveLength(2)
    expect(results.map((result) => result.id)).toEqual(['cloudflare', 'google'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const result of results) {
      expect(result.status).toBe('ok')
      expect(result.dnsStatus).toBe(3)
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('reports error status with the real measured response time when the resolver replies with an HTTP error', async () => {
    global.fetch = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch

    const results = await compareDnsResolvers()

    for (const result of results) {
      expect(result.status).toBe('error')
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.dnsStatus).toBeNull()
    }
  })

  it('reports timeout status when the request is aborted by the timeout signal', async () => {
    global.fetch = vi.fn(async () => {
      throw new DOMException('The operation was aborted', 'TimeoutError')
    }) as unknown as typeof fetch

    const results = await compareDnsResolvers()

    for (const result of results) {
      expect(result.status).toBe('timeout')
      expect(result.responseTimeMs).toBeNull()
    }
  })
})
