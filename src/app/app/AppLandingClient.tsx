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
  AppLandingCTA
} from './AppLandingComponents'

export function AppLandingClient() {
  const { entrarNaListaDeTeste, testarNoNavegador } = useAppLanding()

  useRevealOnScroll()

  return (
    <div className="relative flex w-full flex-col">
      <AppLandingHero onEntrar={entrarNaListaDeTeste} onTestarWeb={testarNoNavegador} />

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
