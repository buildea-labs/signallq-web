"use client";
import { useCallback, useState } from 'react'
import { compareDnsResolvers, type ResolverResult } from '@/lib/dnsCompare'

export type DnsCompareState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; results: ResolverResult[] }
  | { status: 'error' }

// Controller da comparação de resolvedores DNS — a página só lê `state` e
// chama `run`; toda a lógica de medição vive em `lib/dnsCompare.ts`.
export function useDnsCompare() {
  const [state, setState] = useState<DnsCompareState>({ status: 'idle' })

  const run = useCallback(async () => {
    setState({ status: 'running' })
    try {
      const results = await compareDnsResolvers()
      setState({ status: 'done', results })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  return { state, run }
}
