"use client";
import { useRevealOnScroll } from './useRevealOnScroll'
import { useAppLanding } from './useAppLanding'
import {
  AppLandingHero,
  AppLandingFeatures,
  AppLandingGallery,
  AppLandingSteps,
  AppLandingCompare,
  AppLandingTrust,
  AppLandingCTA,
  APP_DIFERENCIAIS_ID,
} from './AppLandingComponents'

export function AppLandingClient() {
  const { entrarNaListaDeTeste, testarNoNavegador } = useAppLanding()

  useRevealOnScroll()

  function verDiferenciais() {
    const el = document.getElementById(APP_DIFERENCIAIS_ID)
    if (!el) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    // Move o foco de teclado junto com o scroll (padrão de skip-link): quem
    // ativou a seta via teclado continua a navegação a partir da seção
    // revelada, em vez de ficar com o foco "perdido" no botão que já saiu
    // da viewport.
    el.focus({ preventScroll: true })
  }

  return (
    <div className="relative flex w-full flex-col">
      <AppLandingHero
        onEntrar={entrarNaListaDeTeste}
        onTestarWeb={testarNoNavegador}
        onVerDiferenciais={verDiferenciais}
      />

      <div className="w-full box-border flex justify-center pb-4 px-[var(--safe-x)]">
        <div className="w-full max-w-[1080px] flex flex-col gap-[56px]">
          <AppLandingFeatures />
          <AppLandingGallery />
          <AppLandingSteps />
          <AppLandingCompare />
          <AppLandingTrust />
          <AppLandingCTA onEntrar={entrarNaListaDeTeste} onTestarWeb={testarNoNavegador} />
        </div>
      </div>
    </div>
  )
}
