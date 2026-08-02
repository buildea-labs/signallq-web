// Lock de medição entre abas. Só uma aba mede por vez: a aba que inicia grava
// um lock em localStorage e o renova por heartbeat enquanto mede; outra aba que
// encontre um lock vivo (renovado há menos de LOCK_TTL_MS) entra em
// 'bloqueado-outra-aba'. O TTL evita lock órfão de aba que morreu sem liberar.
import { useCallback, useEffect, useRef } from 'react'

const LOCK_KEY = 'signallq_speedtest_lock_v1'
const LOCK_TTL_MS = 4000
const HEARTBEAT_MS = 1500

export interface SpeedTestTabLock {
  acquire: () => void
  release: () => void
  stopHeartbeat: () => void
  startHeartbeat: () => void
  hasForeignLock: () => boolean
}

export function useSpeedTestTabLock(): SpeedTestTabLock {
  const tabIdRef = useRef(Math.random().toString(36).slice(2))
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const acquire = useCallback(() => {
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ tabId: tabIdRef.current, ts: Date.now() }))
    } catch {
      // localStorage indisponível (modo privado restrito) — segue sem lock
    }
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatRef.current = setInterval(acquire, HEARTBEAT_MS)
  }, [acquire, stopHeartbeat])

  const release = useCallback(() => {
    stopHeartbeat()
    try {
      const raw = localStorage.getItem(LOCK_KEY)
      if (raw && JSON.parse(raw).tabId === tabIdRef.current) localStorage.removeItem(LOCK_KEY)
    } catch {
      // idem
    }
  }, [stopHeartbeat])

  const hasForeignLock = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(LOCK_KEY)
      if (!raw) return false
      const lock = JSON.parse(raw) as { tabId: string; ts: number }
      return lock.tabId !== tabIdRef.current && Date.now() - lock.ts < LOCK_TTL_MS
    } catch {
      return false
    }
  }, [])

  // Fechar/recarregar a aba precisa liberar o lock na hora, senão a próxima aba
  // fica bloqueada até o TTL expirar.
  useEffect(() => {
    window.addEventListener('beforeunload', release)
    return () => {
      window.removeEventListener('beforeunload', release)
      stopHeartbeat()
      release()
    }
  }, [release, stopHeartbeat])

  return { acquire, release, stopHeartbeat, startHeartbeat, hasForeignLock }
}
