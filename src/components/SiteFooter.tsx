import Image from 'next/image'
import Link from 'next/link'

export function SiteFooter() {
  const links = [
    { label: "Teste de velocidade", href: "/" },
    { label: "Histórico", href: "/historico" },
    { label: "Como medimos", href: "/como-medimos" },
    { label: "Comparar servidores DNS", href: "/dns" },
    { label: "Latência para jogos", href: "/jogos" },
    { label: "Internet boa mas travando", href: "/internet-boa-mas-travando" },
    { label: "Lag em jogos online", href: "/lag-em-jogos-online" },
    { label: "Comparativo", href: "/comparativo" },
    { label: "Quem somos", href: "/sobre" },
    { label: "Política de Privacidade", href: "/privacidade" },
    { label: "Termos de Uso", href: "/termos" },
  ];

  return (
    <div className="hidden sm:block relative z-[2] w-full box-border bg-transparent border-t border-[color-mix(in_srgb,_var(--border)_14%,_transparent)]">
      {/* Compact */}
      <div className="hidden sm:flex lg:hidden flex-wrap items-center gap-x-5 gap-y-[10px] py-[14px] px-5 box-border max-w-[1280px] mx-auto">
        <Image
          className="sq-logo-light object-contain block"
          src="/assets/signallq-lockup-light-bg-v5.png"
          alt=""
          aria-hidden="true"
          width={88}
          height={22}
        />
        <Image
          className="sq-logo-dark object-contain hidden"
          src="/assets/signallq-lockup-dark-bg-v5.png"
          alt=""
          aria-hidden="true"
          width={88}
          height={22}
        />
        <span className="rounded-full py-[1px] px-[8px] font-medium text-[11px] leading-[1.6] font-sans text-[color:var(--on-accent)] bg-[color:var(--accent)]">
          Beta
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((l, i) => (
            <Link key={i} href={l.href} className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-primary)] no-underline hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto font-normal text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] text-right">
          © 2026 SignallQ · by Buildea. O teste web está disponível em beta; o aplicativo Android está em teste fechado.
        </div>
      </div>

      {/* Full */}
      <div className="hidden lg:block">
        <div className="max-w-[1280px] mx-auto flex flex-wrap justify-between gap-[40px] pt-[48px] px-5 pb-[28px] box-border">
          <div className="max-w-[320px] flex flex-col gap-3">
            <Image
              className="sq-logo-light self-start object-contain block"
              src="/assets/signallq-lockup-light-bg-v5.png"
              alt=""
              aria-hidden="true"
              width={128}
              height={32}
            />
            <Image
              className="sq-logo-dark self-start object-contain hidden"
              src="/assets/signallq-lockup-dark-bg-v5.png"
              alt=""
              aria-hidden="true"
              width={128}
              height={32}
            />
            <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-secondary)]">
              Teste de velocidade e diagnóstico de conexão.
            </div>
            <span className="self-start rounded-full py-[1px] px-[8px] font-medium text-[11px] leading-[1.6] font-sans text-[color:var(--on-accent)] bg-[color:var(--accent)]">
              Beta
            </span>
          </div>

          <div className="flex flex-wrap gap-[48px]">
            <div className="flex flex-col gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
                Produto
              </div>
              <Link href="/" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Teste de velocidade</Link>
              <Link href="/historico" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Histórico</Link>
              <Link href="/como-medimos" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Como medimos</Link>
              <Link href="/dns" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Comparar servidores DNS</Link>
              <Link href="/jogos" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Latência para jogos</Link>
            </div>
            <div className="flex flex-col gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
                Guias
              </div>
              <Link href="/internet-boa-mas-travando" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Internet boa mas travando</Link>
              <Link href="/lag-em-jogos-online" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Lag em jogos online</Link>
              <Link href="/internet-para-jogos" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Internet para jogos</Link>
            </div>
            <div className="flex flex-col gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
                Institucional
              </div>
              <Link href="/sobre" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Quem somos</Link>
              <Link href="/privacidade" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Política de Privacidade</Link>
              <Link href="/termos" className="font-normal text-[14px] text-[color:var(--text-primary)] no-underline hover:underline">Termos de Uso</Link>
            </div>
            <div className="flex flex-col items-start gap-[10px]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
                Baixe o app
              </div>
              <Link href="/app" className="relative inline-flex no-underline">
                <Image
                  src="/assets/google-play-badge-transparent.png"
                  alt="Disponível no Google Play"
                  width={182}
                  height={71}
                  className="block opacity-80"
                />
                <span className="absolute -top-[8px] -right-[10px] rounded-full py-[2px] px-[8px] font-bold text-[10px] leading-[1.4] tracking-[.04em] uppercase text-[color:var(--on-accent)] bg-[color:var(--accent)] whitespace-nowrap">
                  Teste fechado
                </span>
              </Link>
              <div className="font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)] max-w-[220px]">
                Diagnóstico completo de Wi-Fi, sinal móvel e modem de fibra.
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto flex flex-wrap justify-between gap-2 border-t border-[color-mix(in_srgb,_var(--border)_18%,_transparent)] pt-4 px-5 pb-[28px] box-border">
          <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            © 2026 SignallQ · by Buildea. O teste web está disponível em beta; o aplicativo Android está em teste fechado.
          </div>
        </div>
      </div>
    </div>
  );
}
