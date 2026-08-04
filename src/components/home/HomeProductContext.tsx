import Link from "next/link";
import { DIAG_ITEMS } from "./homeCopy";

/** Contexto de produto exibido no repouso: ferramentas adicionais. */
export function HomeProductContext({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="w-full pt-3 pb-8 flex flex-wrap justify-center gap-6 sm:gap-10">
      {DIAG_ITEMS.map((item) => (
        <Link 
          key={item.label} 
          href={item.href} 
          className="flex flex-col items-center gap-2 group text-decoration-none no-underline"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl bg-[color:var(--bg-secondary)] shadow-[0_4px_14px_rgba(0,0,0,.10)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,.15)] group-hover:-translate-y-1 transition-all duration-300">
            <span aria-hidden="true" className="material-symbols-outlined text-[32px] sm:text-[40px] text-[color:var(--accent)]">
              {item.icon}
            </span>
          </div>
          <span className="font-medium text-[13px] sm:text-[14px] leading-[1.3] text-[color:var(--text-primary)] whitespace-nowrap text-center">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
