export function formatarDataHora(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

export function formatarDuracao(durationMs: number | undefined): string {
  if (durationMs == null || durationMs <= 0) return "—";
  return `${Math.max(1, Math.round(durationMs / 1000))} s`;
}
