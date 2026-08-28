"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { PlayStoreBadge } from "./PlayStoreBadge";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      // Esconde a barra se rolar para baixo (passando do topo), revela se rolar para cima
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    handleScroll(); // Verifica no primeiro render
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={clsx(
      "sticky top-0 z-[3] w-full box-border transition-all duration-300",
      scrolled ? "bg-[color:var(--bg-card)] border-b border-[color-mix(in_srgb,_var(--border)_25%,_transparent)] shadow-[0_4px_24px_rgba(0,0,0,0.2)]" : "bg-transparent border-b border-transparent",
      hidden ? "-translate-y-full" : "translate-y-0"
    )}>
      <div className="relative mx-auto max-w-[1280px] min-h-[76px] flex items-center justify-between gap-4 py-[14px] px-[20px] box-border">
        <Link href="/" aria-label="Página inicial SignallQ">
          <Image
            className="sq-logo-light block shrink-0"
            src="/assets/signallq-lockup-light-bg-v5.png"
            alt=""
            aria-hidden="true"
            width={128}
            height={32}
          />
          <Image
            className="sq-logo-dark hidden shrink-0"
            src="/assets/signallq-lockup-dark-bg-v5.png"
            alt=""
            aria-hidden="true"
            width={128}
            height={32}
          />
        </Link>

        <PlayStoreBadge height={36} source="site_nav" />
      </div>
    </header>
  );
}
