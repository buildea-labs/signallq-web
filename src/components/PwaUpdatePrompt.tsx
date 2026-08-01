'use client'

import { useEffect, useRef, useState } from 'react'

const UPDATE_CHECK_INTERVAL_MS = 60_000

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateConfirmed = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let registration: ServiceWorkerRegistration | undefined
    const observe = (candidate: ServiceWorkerRegistration) => {
      registration = candidate
      if (candidate.waiting) setNeedRefresh(true)
      candidate.addEventListener('updatefound', () => {
        const worker = candidate.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) setNeedRefresh(true)
        })
      })
    }

    navigator.serviceWorker.ready.then((candidate) => {
      observe(candidate)
      void candidate.update().catch(() => undefined)
    }).catch(() => undefined)
    const timer = window.setInterval(() => void registration?.update().catch(() => undefined), UPDATE_CHECK_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const reloadOnControllerChange = () => {
      if (updateConfirmed.current) window.location.reload()
    }
    navigator.serviceWorker?.addEventListener('controllerchange', reloadOnControllerChange)
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', reloadOnControllerChange)
  }, [])

  if (!needRefresh) return null

  return (
    <div
      className="sq-fade-up flex items-center gap-1.5 rounded-full border py-2 pl-3.5 pr-2"
      style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)', background: 'var(--bg-card)' }}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>
        sync
      </span>
      <span className="label-medium" style={{ color: 'var(--text-primary)' }}>
        Nova versão disponível
      </span>
      <button
        type="button"
        onClick={() => {
          void navigator.serviceWorker.getRegistration().then((registration) => {
            if (!registration?.waiting) return
            updateConfirmed.current = true
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          })
        }}
        className="border-none bg-transparent p-0"
      >
        <span className="label-medium" style={{ color: 'var(--accent)' }}>
          Atualizar
        </span>
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Fechar"
        className="flex h-5 w-5 items-center justify-center border-none bg-transparent p-0"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          close
        </span>
      </button>
    </div>
  )
}
