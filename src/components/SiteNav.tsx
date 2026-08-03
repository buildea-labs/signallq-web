"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SiteNavMobile } from "./SiteNavMobile";

const ITENS = [
  { key: "home", label: "Velocidade", href: "/" },
  { key: "historico", label: "Histórico", href: "/historico" },
  { key: "como-medimos", label: "Como funciona", href: "/como-medimos" },
  { key: "sobre", label: "Sobre o SignallQ", href: "/sobre" },
  { key: "privacidade", label: "Privacidade", href: "/privacidade" },
];



export function SiteNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Fecha o menu mobile ao navegar (troca de rota) — ajuste de estado durante o
  // render (padrão React para "resetar estado quando uma prop muda"), não em
  // efeito, para não disparar setState síncrono dentro de useEffect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  let active = "home";
  if (pathname?.includes("/historico")) active = "historico";
  else if (pathname?.includes("/como-medimos")) active = "como-medimos";
  else if (pathname?.includes("/sobre")) active = "sobre";
  else if (pathname?.includes("/privacidade")) active = "privacidade";
  else if (pathname?.includes("/termos")) active = "termos";
  else if (pathname?.includes("/internet-boa-mas-travando")) active = "bufferbloat";
  else if (pathname?.includes("/lag-em-jogos-online")) active = "cgnat";
  else if (pathname?.includes("/comparativo")) active = "comparativo";
  else if (pathname?.includes("/app")) active = "app";
  const isApp = active === "app";

  // Fecha o menu mobile ao pressionar Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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

        <div className="hidden md:flex items-center gap-[28px]">
          {ITENS.map((it) => {
            const isActive = it.key === active;
            return (
              <Link
                key={it.key}
                href={it.href}
                className={clsx(
                  "whitespace-nowrap pb-[4px] font-medium text-[14px] leading-[1.43] font-sans transition-colors border-b-2",
                  isActive
                    ? "text-[color:var(--accent)] border-[color:var(--accent)]"
                    : "text-[color:var(--text-primary)] border-transparent hover:text-[color:var(--accent)]"
                )}
              >
                {it.label}
              </Link>
            );
          })}
          <Link
            href="/app"
            className={clsx(
              "flex items-center gap-[6px] rounded-full py-[8px] px-[14px] no-underline transition-colors",
              isApp ? "bg-[color:var(--accent)]" : "bg-[color-mix(in_srgb,_var(--accent)_12%,_transparent)]"
            )}
          >
            <span
              className={clsx(
                "material-symbols-outlined text-[16px]",
                isApp ? "text-[color:var(--on-accent)]" : "text-[color:var(--accent)]"
              )}
              aria-hidden="true"
            >
              android
            </span>
            <span
              className={clsx(
                "whitespace-nowrap font-medium text-[13px] leading-[1.3]",
                isApp ? "text-[color:var(--on-accent)]" : "text-[color:var(--accent)]"
              )}
            >
              App
            </span>
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="site-nav-mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden w-[40px] h-[40px] rounded-full flex items-center justify-center cursor-pointer bg-transparent border-none p-0"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[24px] text-[color:var(--text-primary)]">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>

        <SiteNavMobile menuOpen={menuOpen} setMenuOpen={setMenuOpen} active={active} />
      </div>
    </header>
  );
}
