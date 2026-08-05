"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Ação da tela: mede de novo (`onClick`) ou leva a outra ferramenta (`href`). */
export type AlertScreenAction = {
  label: string;
  variant: "primary" | "secondary";
} & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });

/**
 * Tela cheia de falha/ausência de conexão — telas 1.4 e 1.5 do protótipo:
 * círculo com o ícone, uma frase direta que não culpa a pessoa e no máximo
 * duas saídas. Sem cartão, sem sombra pesada, sem texto técnico.
 */
export function AlertScreen({
  icon,
  tone,
  title,
  description,
  actions,
  children,
}: {
  icon: string;
  tone: "error" | "neutral";
  title: string;
  description?: string;
  actions: AlertScreenAction[];
  children?: ReactNode;
}) {
  const iconColor = tone === "error" ? "var(--error)" : "var(--text-secondary)";

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-[18px] px-4 text-center">
      <span
        aria-hidden="true"
        className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in srgb, ${iconColor} 14%, transparent)` }}
      >
        <span className="material-symbols-outlined text-[30px]" style={{ color: iconColor }}>
          {icon}
        </span>
      </span>

      <h2 className="m-0 font-bold text-[17px] leading-[1.3] tracking-[-0.2px] text-[color:var(--text-primary)] sm:text-[20px]">
        {title}
      </h2>

      {description && (
        <p className="m-0 max-w-[320px] text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">{description}</p>
      )}

      {children}

      <div className="mt-[6px] flex w-full flex-col gap-[10px] sm:w-auto sm:flex-row sm:justify-center">
        {actions.map((action) => {
          const className =
            action.variant === "primary"
              ? "flex min-h-[48px] w-full items-center justify-center rounded-[14px] border-none bg-[color:var(--accent)] px-7 font-bold text-[14px] text-[color:var(--on-accent)] no-underline transition-[filter] hover:brightness-110 cursor-pointer sm:w-auto"
              : "flex min-h-[48px] w-full items-center justify-center rounded-[14px] border border-[color:color-mix(in_srgb,var(--border)_45%,transparent)] bg-transparent px-7 font-bold text-[14px] text-[color:var(--text-primary)] no-underline transition-colors hover:bg-[color:var(--bg-secondary)] cursor-pointer sm:w-auto";

          return action.href ? (
            <Link key={action.label} href={action.href} className={className}>
              {action.label}
            </Link>
          ) : (
            <button key={action.label} type="button" onClick={action.onClick} className={className}>
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
