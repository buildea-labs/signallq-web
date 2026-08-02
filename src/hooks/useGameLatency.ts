"use client";
import { useCallback, useState } from 'react'
import { measureGameEndpoints, type GameLatencyResult } from '@/lib/gameLatency'

export type GameLatencyState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; results: GameLatencyResult[] }
  | { status: 'error' }

// Controller da medição de latência de infraestrutura de jogos — a página só
// lê `state` e chama `run`; toda a lógica de medição vive em `lib/gameLatency.ts`.
export function useGameLatency() {
  const [state, setState] = useState<GameLatencyState>({ status: 'idle' })

  const run = useCallback(async () => {
    setState({ status: 'running' })
    try {
      const results = await measureGameEndpoints()
      setState({ status: 'done', results })
    } catch {
      setState({ status: 'error' })
    }
  }, [])

  return { state, run }
}
