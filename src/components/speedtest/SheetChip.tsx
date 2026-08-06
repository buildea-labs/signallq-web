"use client";

/** Chip selecionável do sheet de diagnóstico (protótipo, tela 2.1). */
export function SheetChip({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={`min-h-[36px] rounded-full px-[13px] text-[12px] leading-[1.2] transition-colors cursor-pointer ${
        checked
          ? "border-[1.5px] border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] font-bold text-[color:var(--accent)]"
          : "border border-[color:color-mix(in_srgb,var(--border)_45%,transparent)] bg-transparent font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
      }`}
    >
      {label}
    </button>
  );
}

/** Grupo de chips com rótulo, na forma dos grupos "Rede" e "Problema". */
export function SheetChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="m-0 mb-2 font-bold text-[11px] uppercase leading-[1.4] tracking-[.4px] text-[color:var(--text-secondary)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-[7px]">{children}</div>
    </div>
  );
}
