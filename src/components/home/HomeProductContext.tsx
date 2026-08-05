import Link from "next/link";
import { DIAG_ITEMS } from "./homeCopy";

/**
 * Seção "Ferramentas" abaixo do conteúdo principal (protótipo, telas 1.3 e
 * 2.4): cartões baixos com ícone, nome e uma linha do que a ferramenta faz.
 * Continuam disponíveis tanto no resultado rápido quanto no completo.
 */
export function HomeProductContext({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <section aria-labelledby="home-ferramentas" className="w-full max-w-[560px] pt-6 pb-8">
      <h2
        id="home-ferramentas"
        className="m-0 mb-[10px] font-bold text-[11px] uppercase leading-[1.45] tracking-[.4px] text-[color:var(--text-secondary)]"
      >
        Ferramentas
      </h2>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {DIAG_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-[88px] flex-col gap-[6px] rounded-[16px] bg-[color:var(--bg-secondary)] p-[10px] no-underline transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-[0_6px_18px_rgba(0,0,0,.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-4"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--accent)] sm:text-[24px]">
              {item.icon}
            </span>
            <span className="flex flex-col">
              <span className="font-bold text-[11.5px] leading-[1.3] text-[color:var(--text-primary)] sm:text-[13px]">
                {item.label}
              </span>
              <span className="mt-[2px] font-normal text-[9.5px] leading-[1.25] text-[color:var(--text-secondary)] sm:text-[11px]">
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
