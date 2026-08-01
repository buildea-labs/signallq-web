export type SpeedometerPhase = "idle" | "preparando" | "latencia" | "download" | "upload" | "processando" | "concluido";
export type SpeedometerOutcome = "complete" | "partial" | "inconclusive" | "contaminated" | "cancelled";
export type SpeedometerIdentity = { label: string; narrative: string; color: string };

/** Fonte: Android `VelocidadeScreen.kt` e `MeasurementStatus.kt`. */
export const SPEEDOMETER_PHASE = {
  idle: { label: "AGUARDANDO", narrative: "Preparando o teste…", color: "var(--accent)" },
  preparando: { label: "AGUARDANDO", narrative: "Preparando o teste…", color: "var(--accent)" },
  latencia: { label: "LATÊNCIA", narrative: "Verificando a resposta do servidor…", color: "var(--phase-latencia)" },
  download: { label: "DOWNLOAD", narrative: "Medindo a velocidade de download…", color: "var(--phase-download)" },
  upload: { label: "UPLOAD", narrative: "Medindo a velocidade de upload…", color: "var(--phase-upload)" },
  processando: { label: "CONCLUÍDO", narrative: "Quase pronto…", color: "var(--success)" },
  concluido: { label: "CONCLUÍDO", narrative: "Quase pronto…", color: "var(--success)" },
} satisfies Record<SpeedometerPhase, SpeedometerIdentity>;

export const SPEEDOMETER_OUTCOME = {
  complete: { label: "Completo", narrative: "Medição concluída.", color: "var(--success)" },
  partial: { label: "Parcial", narrative: "Alguma fase não terminou. Use apenas as métricas disponíveis.", color: "var(--warning)" },
  inconclusive: { label: "Inconclusivo", narrative: "Não houve amostras de latência suficientes. Repita o teste.", color: "var(--warning)" },
  contaminated: { label: "Contaminado", narrative: "A conexão mudou durante a medição; repita para obter um resultado confiável.", color: "var(--warning)" },
  cancelled: { label: "Cancelado", narrative: "Você cancelou a medição antes do fim.", color: "var(--text-secondary)" },
} satisfies Record<SpeedometerOutcome, SpeedometerIdentity>;

export const SPEEDOMETER_ERROR: SpeedometerIdentity = {
  label: "Erro",
  narrative: "Não foi possível completar o teste.",
  color: "var(--error)",
};
