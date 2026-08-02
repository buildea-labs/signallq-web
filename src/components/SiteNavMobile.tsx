import Link from 'next/link'
import clsx from 'clsx'

// 3 grupos do menu mobile - 1:1 com MENU_GROUPS de SiteNav.dc.html.
export const MENU_GROUPS = [
  {
    title: "Produto",
    items: [
      { key: "home", label: "Velocidade", href: "/" },
      { key: "historico", label: "Histórico", href: "/historico" },
      { key: "como-medimos", label: "Como funciona", href: "/como-medimos" },
    ],
  },
  {
    title: "Guias",
    items: [
      { key: "bufferbloat", label: "Internet boa mas travando", href: "/internet-boa-mas-travando" },
      { key: "cgnat", label: "Lag em jogos online", href: "/lag-em-jogos-online" },
      { key: "comparativo", label: "Comparativos", href: "/comparativo" },
    ],
  },
  {
    title: "Institucional",
    items: [
      { key: "sobre", label: "Quem somos", href: "/sobre" },
      { key: "privacidade", label: "Política de Privacidade", href: "/privacidade" },
      { key: "termos", label: "Termos de Uso", href: "/termos" },
    ],
  },
];

export function SiteNavMobile({
  menuOpen,
  setMenuOpen,
  active,
}: {
  menuOpen: boolean;
  setMenuOpen: (val: boolean) => void;
  active: string;
}) {
  if (!menuOpen) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className="md:hidden fixed inset-0 z-[30] bg-black/40"
      />
      <nav
        id="site-nav-mobile-menu"
        aria-label="Navegação do site"
        className="md:hidden absolute right-[20px] top-full z-[31] mt-2 w-[272px] max-h-[70vh] overflow-y-auto box-border rounded-2xl border border-[color-mix(in_srgb,_var(--border)_30%,_transparent)] bg-[color:var(--bg-card)] shadow-[0_24px_48px_rgba(0,0,0,.28)] p-2"
      >
        {MENU_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-3 pt-3 pb-1 font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
              {group.title}
            </div>
            {group.items.map((it) => {
              const isActive = it.key === active;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className={clsx(
                    "min-h-[44px] flex items-center px-3 rounded-[10px] font-medium text-[14px] leading-[1.4] font-sans no-underline",
                    isActive
                      ? "text-[color:var(--accent)] bg-[color-mix(in_srgb,_var(--accent)_12%,_transparent)]"
                      : "text-[color:var(--text-primary)]"
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mt-1 border-t border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] p-3 font-normal text-[11px] leading-[1.4] text-[color:var(--text-tertiary)]">
          © 2026 SignallQ · by Buildea. O teste web está disponível em beta; o aplicativo Android está em teste fechado.
        </div>
      </nav>
    </>
  );
}
