import { afterEach, describe, expect, it, vi } from 'vitest'

import { measureGameEndpoints } from './gameLatency'

describe('measureGameEndpoints', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('measures all three endpoints and reports ok status on a successful response', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }))
    global.fetch = fetchMock as unknown as typeof fetch

    const results = await measureGameEndpoints()

    expect(results).toHaveLength(3)
    expect(results.map((result) => result.id)).toEqual(['steam', 'riot', 'xbox'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    for (const result of results) {
      expect(result.status).toBe('ok')
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('reports error status with the real measured response time when the endpoint replies with an HTTP error', async () => {
    global.fetch = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch

    const results = await measureGameEndpoints()

    for (const result of results) {
      expect(result.status).toBe('error')
      expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('reports timeout status when the request is aborted by the timeout signal', async () => {
    global.fetch = vi.fn(async () => {
      throw new DOMException('The operation was aborted', 'TimeoutError')
    }) as unknown as typeof fetch

    const results = await measureGameEndpoints()

    for (const result of results) {
      expect(result.status).toBe('timeout')
      expect(result.responseTimeMs).toBeNull()
    }
  })
})
