import Link from "next/link";
import { DIAG_ITEMS } from "@/components/home/homeCopy";

export function FerramentasSecao() {
  return (
    <nav
      aria-label="Ferramentas"
      className="w-full grid grid-cols-3 overflow-hidden rounded-xl border border-[color-mix(in_srgb,_var(--border)_14%,_transparent)] bg-[color:var(--bg-card)]"
    >
      {DIAG_ITEMS.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-1 py-4 px-2 no-underline hover:bg-[color:var(--bg-secondary)] transition-colors ${
            index > 0 ? "border-l border-[color-mix(in_srgb,_var(--border)_14%,_transparent)]" : ""
          }`}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--accent)]">
            {item.icon}
          </span>
          <span className="font-medium text-[12px] leading-[1.33] text-center text-[color:var(--text-primary)]">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
