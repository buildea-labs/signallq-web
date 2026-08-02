"use client";
import { useEffect } from 'react'
import { useAppLanding } from './useAppLanding'
import {
  AppLandingHero,
  AppLandingFeatures,
  AppLandingSteps,
  AppLandingCompare,
  AppLandingCTA
} from './AppLandingComponents'

export function AppLandingClient() {
  const { entrarNaListaDeTeste } = useAppLanding()

  useEffect(() => {
    let n = 0;
    const items: HTMLElement[] = [];

    function scan() {
      document.querySelectorAll('.sq-app-reveal').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.dataset.sqRev) return;
        htmlEl.dataset.sqRev = '1';
        htmlEl.style.transitionDelay = ((n++ % 4) * 90) + 'ms';
        items.push(htmlEl);
      });
      check();
    }

    function check() {
      const h = window.innerHeight || 800;
      for (let i = items.length - 1; i >= 0; i--) {
        const el = items[i];
        const r = el.getBoundingClientRect();
        if (r.top < h * 0.92 && r.bottom > -h * 0.4) {
          el.classList.add('sq-in');
          items.splice(i, 1);
        }
      }
    }

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    ['scroll', 'wheel', 'resize'].forEach(ev => {
      window.addEventListener(ev, check, { passive: true, capture: true });
    });
    const interval = setInterval(check, 250);

    return () => {
      observer.disconnect();
      ['scroll', 'wheel', 'resize'].forEach(ev => {
        window.removeEventListener(ev, check, { capture: true });
      });
      clearInterval(interval);
    }
  }, [])

  return (
    <div className="relative flex w-full flex-col">
      <AppLandingHero onEntrar={entrarNaListaDeTeste} />

      <div className="w-full box-border flex justify-center pb-4 px-[var(--safe-x)]">
        <div className="w-full max-w-[1080px] flex flex-col gap-[56px]">
          <AppLandingFeatures />
          <AppLandingSteps />
          <AppLandingCompare />
          <AppLandingCTA onEntrar={entrarNaListaDeTeste} />
        </div>
      </div>
    </div>
  )
}
