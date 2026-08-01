"use client";

import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Velocimetro } from "@/components/Velocimetro";
import { FaixaMetricas, type ItemFaixaMetricas } from "@/components/FaixaMetricas";
import { EstadoVazio } from "@/components/EstadoVazio";
import { ListaChaveValor } from "@/components/ListaChaveValor";
import { LinhaChips } from "@/components/LinhaChips";
import { SegmentedControl } from "@/components/SegmentedControl";
import { PlayStoreBadge } from "@/components/PlayStoreBadge";
import { GuidedDiagnosis } from "@/components/speedtest/GuidedDiagnosis";
import { useSpeedTest, FasePainel, ProblemPhase } from "@/hooks/useSpeedTest";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { PAGE_META } from "@/lib/pageMetaCatalog";
import {
  classifyDownload,
  classifyLatency,
  classifyUpload,
  interpretUseCases,
  type Nivel,
} from "@/lib/classification";
import { fractionForLatency, fractionForThroughput } from "@/lib/gaugeMath";
import type { SpeedTestResult } from "@/lib/speedEngine";
import {
  FEATURE_SPEEDTEST_COMPARTILHOU,
  FEATURE_SPEEDTEST_ENTRADA_DIRETA,
  FEATURE_SPEEDTEST_ENTRADA_PROBLEMA,
  FEATURE_SPEEDTEST_PROBLEMA_ABANDONADO,
  FEATURE_SPEEDTEST_PROBLEMA_SELECIONADO,
  trackFeatureUsed,
} from "@/lib/telemetry";
import { PROBLEMAS_PERCEBIDOS, type ProblemaPercebido } from "@/lib/problemEntry";
import { createMeasurementSessionContext } from "@/lib/measurementSessionContext";
import { readMeasurementSession } from "@/lib/measurementSessionStore";
import { createWebDiagnosticResponse } from "@/lib/webDiagnosticResponse";
import { addComparison } from "@/lib/historyStore";
import { compareRetest, comparisonMode, type RetestComparison } from "@/lib/retestComparison";

const RUNNING_PHASES: FasePainel[] = [
  "preparando",
  "latencia",
  "download",
  "upload",
  "processando",
];
const PROBLEM_PHASES: ProblemPhase[] = [
  "sem-conexao",
  "conexao-interrompida",
  "endpoint-indisponivel",
  "erro-inesperado",
  "cancelado",
  "bloqueado-outra-aba",
];

const MODOS = [
  { value: "rapido" as const, label: "Rápido" },
  { value: "completo" as const, label: "Completo" },
];

const MODO_EXPLICACAO = {
  rapido: "Triagem curta: mede velocidade, latência e resposta sob carga para orientar o próximo passo.",
  completo: "Mais amostras e mais tempo sob carga: produz evidência mais estável para a avaliação oficial.",
} as const;

const DIAG_ITEMS = [
  { icon: "speed", label: "Velocidade e latência", href: "/velocidade-e-latencia" },
  { icon: "hourglass_bottom", label: "Latência sob carga", href: "/latencia-sob-carga" },
  { icon: "dns", label: "Servidores DNS", href: "/servidores-dns" },
  { icon: "sports_esports", label: "Modo gamer", href: "/modo-gamer" },
];

// Mapa de dados dos 6 estados de problema — 1:1 com `PROBLEMAS` de
// `ScreenHome.dc.html`, §7.1 do Guia de Implementação.
const PROBLEMAS: Record<
  ProblemPhase,
  { icon: string; title: string; message: string; actionIcon: string; actionLabel: string; color: string }
> = {
  "sem-conexao": {
    icon: "wifi_off",
    title: "Sem conexão",
    message: "Não conseguimos detectar uma conexão com a internet neste aparelho.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  cancelado: {
    icon: "cancel",
    title: "Teste cancelado",
    message: "Você cancelou a medição antes do fim.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--text-secondary)",
  },
  "bloqueado-outra-aba": {
    icon: "tab",
    title: "Teste em andamento em outra aba",
    message:
      "Evitamos rodar duas medições ao mesmo tempo no mesmo navegador. Você pode iniciar mesmo assim, se preferir.",
    actionIcon: "play_arrow",
    actionLabel: "Iniciar mesmo assim",
    color: "var(--text-secondary)",
  },
  "conexao-interrompida": {
    icon: "sync_problem",
    title: "Conexão interrompida",
    message: "A conexão caiu no meio da medição e não foi possível concluir com confiança.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  "endpoint-indisponivel": {
    icon: "cloud_off",
    title: "Servidor indisponível",
    message: "Não foi possível contatar o servidor de medição agora. Tente novamente em instantes.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
  "erro-inesperado": {
    icon: "error",
    title: "Erro inesperado",
    message: "Algo deu errado durante a medição.",
    actionIcon: "refresh",
    actionLabel: "Tentar novamente",
    color: "var(--error)",
  },
};

// Cor por nível de classificação — mesmo vocabulário de 3 valores
// (Boa/Aceitável/Ruim) já em produção no app Android, ver `lib/classification.ts`.
const NIVEL_COR: Record<Nivel, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--error)",
  indisponivel: "var(--text-tertiary)",
};

const USE_CASE_ICONS = {
  navegacao: "travel_explore",
  streaming: "movie",
  videochamada: "videocam",
  jogosOnline: "sports_esports",
} as const;
const USE_CASE_LABELS: Record<keyof typeof USE_CASE_ICONS, string> = {
  navegacao: "Navegação",
  streaming: "Streaming",
  videochamada: "Videochamadas",
  jogosOnline: "Jogos online",
};

const BUFFERBLOAT_LABEL: Record<SpeedTestResult["bufferbloat"]["severity"], string> = {
  none: "Nenhum",
  mild: "Leve",
  moderate: "Moderado",
  severe: "Severo",
};

const STATUS_LABEL: Record<SpeedTestResult["status"], string> = {
  complete: "Medição completa",
  partial: "Resultado parcial",
  inconclusive: "Resultado inconclusivo",
  contaminated: "Rede alterada durante o teste",
  cancelled: "Teste cancelado",
};
const STATUS_MESSAGE: Partial<Record<SpeedTestResult["status"], string>> = {
  partial: "Alguma fase não terminou. Use apenas as métricas disponíveis.",
  inconclusive: "Não houve amostras de latência suficientes. Repita o teste.",
  contaminated: "A conexão mudou durante a medição; repita para obter um resultado confiável.",
};

function formatarDataHora(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function formatarDuracao(durationMs: number | undefined): string {
  if (durationMs == null || durationMs <= 0) return "—";
  return `${Math.max(1, Math.round(durationMs / 1000))} s`;
}

function formattedSummary(result: SpeedTestResult): string {
  const when = formatarDataHora(result.timestamp);
  return `Meu teste de velocidade SignallQ (${when}): Download ${result.download.mbps.toFixed(1)} Mbps · Upload ${result.upload.mbps.toFixed(1)} Mbps · Latência ${Math.round(result.latency.ms)} ms. Teste a sua em ${location.origin}${location.pathname}`;
}

export default function Home() {
  useDocumentMeta(PAGE_META["/"]);

  const [modo, setModo] = useState<"rapido" | "completo">("rapido");
  const [copiado, setCopiado] = useState(false);
  const [entradaProblemaAberta, setEntradaProblemaAberta] = useState(false);
  const [problemaPercebido, setProblemaPercebido] = useState<ProblemaPercebido | null>(null);
  const [questionarioRetomavel, setQuestionarioRetomavel] = useState(false);
  const [respostasContextuais, setRespostasContextuais] = useState(() => readMeasurementSession()?.answers ?? []);
  const [retesteBase, setRetesteBase] = useState<SpeedTestResult | null>(null);
  const [comparacaoReteste, setComparacaoReteste] = useState<RetestComparison | null>(null);
  const [comparacaoNaoSalva, setComparacaoNaoSalva] = useState(false);
  const abandonoRegistrado = useRef(false);
  const comparacaoPersistida = useRef<string | null>(null);
  const { phase, liveValue, phaseResults, result, measurementContext, cancelTest, retry, forceStart } = useSpeedTest(modo);

  const isIdle = phase === "idle";
  const isRunning = RUNNING_PHASES.includes(phase);
  const isResult =
    phase === "concluido" || phase === "parcial" || phase === "inconclusivo" || phase === "contaminado";
  const isProblem = PROBLEM_PHASES.includes(phase as ProblemPhase);
  // Em caso de falha/cancelamento de um reteste, `useSpeedTest` preserva a
  // rodada anterior; ela continua visível abaixo do estado de falha.
  const hasVisibleResult = isResult || (isProblem && result !== null);
  const showDial = isIdle || isRunning;
  const shellAlign = isRunning || isProblem ? "center" : "start";
  const shouldCollectContextualQuestions = isResult && measurementContext?.entry === "problem";
  const shouldResumeContextualQuestions = isIdle && questionarioRetomavel && measurementContext?.entry === "problem";

  useEffect(() => {
    const session = readMeasurementSession();
    setQuestionarioRetomavel(Boolean(session?.questionnaireActive));
    setRespostasContextuais(session?.answers ?? []);
  }, []);

  useEffect(() => {
    const registrarAbandono = () => {
      if (phase === "idle" && problemaPercebido && !abandonoRegistrado.current) {
        abandonoRegistrado.current = true;
        trackFeatureUsed(FEATURE_SPEEDTEST_PROBLEMA_ABANDONADO);
      }
    };
    window.addEventListener("pagehide", registrarAbandono);
    return () => window.removeEventListener("pagehide", registrarAbandono);
  }, [phase, problemaPercebido]);

  useEffect(() => {
    if (!retesteBase || !result || retesteBase.id === result.id) return;
    const comparison = compareRetest(retesteBase, result);
    setComparacaoReteste(comparison);
    const mode = comparisonMode(result.mode);
    const comparisonId = `${retesteBase.id}:${result.id}`;
    if (!comparison.compatible || !mode || comparacaoPersistida.current === comparisonId) return;
    comparacaoPersistida.current = comparisonId;
    void addComparison({ id: comparisonId, createdAt: Date.now(), beforeId: retesteBase.id, afterId: result.id, mode })
      .catch(() => setComparacaoNaoSalva(true));
  }, [result, retesteBase]);

  const selecionarProblema = (valor: ProblemaPercebido) => {
    abandonoRegistrado.current = false;
    setProblemaPercebido(valor);
    trackFeatureUsed(FEATURE_SPEEDTEST_PROBLEMA_SELECIONADO);
  };

  const iniciarTesteDireto = () => {
    setProblemaPercebido(null);
    setEntradaProblemaAberta(false);
    trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_DIRETA);
    forceStart(createMeasurementSessionContext("direct"));
  };

  const abrirEntradaPorProblema = () => {
    setEntradaProblemaAberta(true);
    trackFeatureUsed(FEATURE_SPEEDTEST_ENTRADA_PROBLEMA);
  };

  const iniciarTesteComProblema = () => {
    if (!problemaPercebido) return;
    abandonoRegistrado.current = true;
    forceStart(createMeasurementSessionContext("problem", problemaPercebido));
  };

  const iniciarReteste = () => {
    if (!result) return;
    setRetesteBase(result);
    setComparacaoReteste(null);
    setComparacaoNaoSalva(false);
    retry();
  };

  let fraction = 0;
  let phaseColor = "var(--accent)";
  let dialNumber = "—";
  let dialUnit = "";
  let dialIcon = "arrow_downward";
  let dialLabel = "";

  if (phase === "latencia") {
    fraction = fractionForLatency(liveValue);
    phaseColor = "var(--phase-latencia)";
    dialNumber = liveValue ? Math.round(liveValue).toString() : "—";
    dialUnit = "ms";
    dialIcon = "network_ping";
    dialLabel = "Latência";
  } else if (phase === "download") {
    fraction = fractionForThroughput(liveValue);
    phaseColor = "var(--phase-download)";
    dialNumber = liveValue ? liveValue.toFixed(1) : "0.0";
    dialUnit = "Mbps";
    dialIcon = "arrow_downward";
    dialLabel = "Download";
  } else if (phase === "upload") {
    fraction = fractionForThroughput(liveValue);
    phaseColor = "var(--phase-upload)";
    dialNumber = liveValue ? liveValue.toFixed(1) : "0.0";
    dialUnit = "Mbps";
    dialIcon = "arrow_upward";
    dialLabel = "Upload";
  } else if (phase === "processando") {
    fraction = 1;
  }

  const problema = isProblem ? PROBLEMAS[phase as ProblemPhase] : null;

  const downloadVerdict = result ? classifyDownload(result.download.mbps) : null;
  const uploadVerdict = result ? classifyUpload(result.upload.mbps) : null;
  const latencyVerdict = result ? classifyLatency(result.latency.ms) : null;
  const useCases = result
    ? interpretUseCases({
        download: result.download.mbps,
        upload: result.upload.mbps,
        latency: result.latency.ms,
        jitter: result.jitter?.ms ?? null,
      })
    : null;
  const statusCompleto = result?.status === "complete";
  const statusMensagem = result ? STATUS_MESSAGE[result.status] : undefined;
  const respostaDiagnostica = result ? createWebDiagnosticResponse(result, measurementContext, respostasContextuais) : null;

  const executarTrio: ItemFaixaMetricas[] = [
    {
      label: "Latência",
      value: phaseResults.latencia != null ? `${Math.round(phaseResults.latencia)} ms` : "—",
      color: phase === "latencia" ? "var(--phase-latencia)" : phaseResults.latencia != null ? undefined : "var(--text-tertiary)",
    },
    {
      label: "Download",
      value: phaseResults.download != null ? `${phaseResults.download.toFixed(1)} Mbps` : "Aguardando",
      color:
        phase === "download"
          ? "var(--phase-download)"
          : phaseResults.download != null
          ? undefined
          : "var(--text-tertiary)",
    },
    {
      label: "Upload",
      value: phaseResults.upload != null ? `${phaseResults.upload.toFixed(1)} Mbps` : "Aguardando",
      color:
        phase === "upload" ? "var(--phase-upload)" : phaseResults.upload != null ? undefined : "var(--text-tertiary)",
    },
  ];

  const resultadoTrio: ItemFaixaMetricas[] | null =
    result && downloadVerdict && uploadVerdict && latencyVerdict
      ? [
          {
            icon: "arrow_downward",
            label: "Download",
            value: result.download.mbps.toFixed(1),
            caption: `Mbps • ${downloadVerdict.label}`,
            color: NIVEL_COR[downloadVerdict.nivel],
          },
          {
            icon: "arrow_upward",
            label: "Upload",
            value: result.upload.mbps.toFixed(1),
            caption: `Mbps • ${uploadVerdict.label}`,
            color: NIVEL_COR[uploadVerdict.nivel],
          },
          {
            icon: "network_ping",
            label: "Latência",
            value: Math.round(result.latency.ms).toString(),
            caption: `ms • ${latencyVerdict.label}`,
            color: NIVEL_COR[latencyVerdict.nivel],
          },
        ]
      : null;

  const compartilhar = async () => {
    if (!result) return;
    const text = formattedSummary(result);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meu teste de velocidade SignallQ", text, url: location.href });
        trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
        return;
      } catch {
        // usuário cancelou o share nativo — cai no fallback de cópia
      }
    }
    await copiarResumo();
  };

  const copiarResumo = async () => {
    if (!result) return;
    const text = formattedSummary(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie o resumo abaixo:", text);
    }
    trackFeatureUsed(FEATURE_SPEEDTEST_COMPARTILHOU);
  };

  return (
    <PageShell align={shellAlign}>
      {isIdle && (
        <div className="flex flex-col items-center gap-[6px] text-center">
          <h1 className="m-0 font-bold text-[26px] sm:text-[30px] leading-[1.2] text-[color:var(--text-primary)]">
            Teste de velocidade
          </h1>
          <p className="m-0 max-w-[460px] font-normal text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">
            Download, upload e latência medidos no seu navegador.
          </p>
        </div>
      )}

      {shouldResumeContextualQuestions && (
        <div className="w-full max-w-[640px] mt-6 pt-6 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
          <GuidedDiagnosis measurementContext={measurementContext} onAnswersChange={setRespostasContextuais} />
        </div>
      )}

      {showDial && (
        <div className="w-full flex flex-col items-center gap-5">
          <Velocimetro fraction={fraction} phaseColor={phaseColor} isRunning={isRunning}>
            {isIdle && (
              <div className="absolute left-1/2 bottom-[26px] -translate-x-1/2 flex flex-col items-center gap-[10px]">
                <button
                  onClick={iniciarTesteDireto}
                  className="h-[44px] px-[26px] rounded-full flex items-center gap-2 border-none bg-[color:var(--accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_45%,_transparent),_0_2px_6px_rgba(0,0,0,.25)] whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px] text-[color:var(--on-accent)]">speed</span>
                  <span className="font-semibold text-[16px] leading-[1.15] text-[color:var(--on-accent)]">
                    Testar agora
                  </span>
                </button>
                <span className="font-normal text-[12px] leading-[1.3] text-[color:var(--text-tertiary)]">
                  {modo === "rapido" ? "Rápido · ~20 s" : "Completo · ~40 s"}
                </span>
              </div>
            )}

            {isRunning && (
              <div className="absolute left-0 right-0 bottom-1 flex flex-col items-center">
                <div className="flex items-center gap-[6px]">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: phaseColor }}>
                    {dialIcon}
                  </span>
                  <span className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-secondary)] tracking-[.3px] uppercase">
                    {dialLabel}
                  </span>
                </div>
                <div className="font-bold text-[44px] sm:text-[54px] leading-none text-[color:var(--text-primary)] tabular-nums">
                  {dialNumber}
                </div>
                <div className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">
                  {dialUnit}
                </div>
              </div>
            )}
          </Velocimetro>

          <div className="w-full max-w-[520px] flex">
            <div className="flex-1 flex items-center justify-center gap-[10px] py-3 px-4">
              <span className="material-symbols-outlined text-[20px] text-[color:var(--text-secondary)]">dns</span>
              <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
                Rede Cloudflare
              </span>
            </div>
          </div>

          {isIdle && (
            <>
              {!entradaProblemaAberta ? (
                <button
                  type="button"
                  onClick={abrirEntradaPorProblema}
                  className="h-[40px] rounded-full px-4 border border-[color:var(--border)] bg-transparent cursor-pointer font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
                >
                  Minha internet está com problema
                </button>
              ) : (
                <section aria-labelledby="problema-title" className="w-full max-w-[520px] rounded-2xl border border-[color:var(--border)] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 id="problema-title" className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">
                        O que está acontecendo?
                      </h2>
                      <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
                        Selecione uma opção para registrar o contexto deste teste.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntradaProblemaAberta(false)}
                      className="h-9 w-9 shrink-0 border-none bg-transparent cursor-pointer text-[color:var(--text-secondary)]"
                      aria-label="Fechar opções de problema"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PROBLEMAS_PERCEBIDOS.map((opcao) => (
                      <button
                        key={opcao.value}
                        type="button"
                        aria-pressed={problemaPercebido === opcao.value}
                        onClick={() => selecionarProblema(opcao.value)}
                        className={`min-h-11 rounded-xl border px-3 text-left font-medium text-[14px] leading-[1.35] cursor-pointer transition-colors ${
                          problemaPercebido === opcao.value
                            ? "border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--text-primary)]"
                            : "border-[color:var(--border)] bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
                        }`}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={iniciarTesteComProblema}
                    disabled={!problemaPercebido}
                    className="mt-4 h-[44px] rounded-full px-5 border-none bg-[color:var(--accent)] cursor-pointer font-semibold text-[14px] text-[color:var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Testar agora
                  </button>
                </section>
              )}
              <div className="w-full max-w-[220px] flex justify-center">
                <SegmentedControl options={MODOS} value={modo} onChange={setModo} />
              </div>
              <p className="m-0 max-w-[360px] text-center font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
                {MODO_EXPLICACAO[modo]}
              </p>
              <a
                href="/como-medimos"
                className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)] no-underline hover:underline"
              >
                Como medimos sua conexão
              </a>
            </>
          )}

          {isRunning && (
            <>
              {measurementContext?.declaredProblem && (
                <p className="m-0 text-center text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
                  Contexto informado: {PROBLEMAS_PERCEBIDOS.find((opcao) => opcao.value === measurementContext.declaredProblem)?.label}
                </p>
              )}
              <FaixaMetricas items={executarTrio} variant="execucao" />
              <button
                onClick={cancelTest}
                className="h-[40px] flex items-center gap-[6px] border-none bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[color:var(--text-primary)]">close</span>
                <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--text-primary)]">
                  Cancelar teste
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {isProblem && problema && (
        <EstadoVazio
          icon={problema.icon}
          title={problema.title}
          message={problema.message}
          actionIcon={problema.actionIcon}
          actionLabel={problema.actionLabel}
          color={problema.color}
          onAction={phase === "bloqueado-outra-aba" ? iniciarTesteDireto : retry}
        />
      )}

      {hasVisibleResult && result && resultadoTrio && useCases && (
        <div className="w-full max-w-[640px] flex flex-col">
          <div className="flex items-center justify-center gap-2 pb-6">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ color: statusCompleto ? "var(--success)" : "var(--warning)" }}
            >
              {statusCompleto ? "check_circle" : "warning"}
            </span>
            <span
              className="font-medium text-[12px] leading-[1.33]"
              style={{ color: statusCompleto ? "var(--success)" : "var(--warning)" }}
            >
              {STATUS_LABEL[result.status]}
            </span>
            <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
              • {formatarDataHora(result.timestamp)}
            </span>
          </div>

          {statusMensagem && (
            <div className="flex items-start justify-center gap-2 py-4 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
              <span className="material-symbols-outlined text-[16px] text-[color:var(--warning)]">
                warning
              </span>
              <div className="font-normal text-[12px] leading-[1.4] text-[color:var(--text-secondary)]">
                <b className="text-[color:var(--text-primary)]">{STATUS_LABEL[result.status]}.</b> {statusMensagem}
              </div>
            </div>
          )}

          {respostaDiagnostica && (
            <section aria-labelledby="resultado-conclusao" className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">Leitura desta medição</div>
              <h1 id="resultado-conclusao" className="mt-[6px] mb-0 font-semibold text-[22px] leading-[1.27] text-[color:var(--text-primary)]">{respostaDiagnostica.conclusion}</h1>
              <p className="mt-2 mb-0 font-normal text-[14px] leading-[1.43] text-[color:var(--text-secondary)]">{respostaDiagnostica.impact}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <h2 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Confiança e limites</h2>
                  <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.confidence}</p>
                </div>
                <div>
                  <h2 className="m-0 font-medium text-[11px] uppercase tracking-[.3px] text-[color:var(--text-tertiary)]">Próxima ação</h2>
                  <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.nextAction}</p>
                </div>
              </div>
              {respostaDiagnostica.androidCta && (
                <div className="mt-4 flex flex-wrap items-center gap-[10px] rounded-xl border border-[color:var(--border)] p-3">
                  <p className="m-0 flex-1 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{respostaDiagnostica.androidCta.reason}</p>
                  <PlayStoreBadge height={32} source="home-resultado-wifi-contextual" />
                </div>
              )}
            </section>
          )}

          {retesteBase && comparacaoReteste && (
            <section aria-labelledby="comparacao-reteste" className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">Antes e depois</div>
              <h2 id="comparacao-reteste" className="mt-[6px] mb-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Comparação desta repetição</h2>
              {comparacaoReteste.compatible && comparacaoReteste.changes ? (
                <>
                  <p className="mt-2 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">Os valores abaixo comparam as duas medições. Eles não comprovam, por si só, a causa de uma mudança.</p>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {comparacaoReteste.changes.map((item) => {
                      const difference = item.after - item.before;
                      const signal = difference === 0 ? "sem mudança" : `${difference > 0 ? "+" : ""}${difference.toFixed(1)} ${item.unit}`;
                      const direction = item.direction === "better" ? "Melhor nesta medição" : item.direction === "worse" ? "Pior nesta medição" : "Sem mudança";
                      return <div key={item.label} className="rounded-xl border border-[color:var(--border)] p-3">
                        <div className="text-[12px] text-[color:var(--text-tertiary)]">{item.label}</div>
                        <div className="mt-1 font-semibold text-[color:var(--text-primary)]">{item.after.toFixed(1)} {item.unit}</div>
                        <div className="mt-1 text-[12px] text-[color:var(--text-secondary)]">Antes: {item.before.toFixed(1)} · {signal}</div>
                        <div className="mt-1 text-[12px] text-[color:var(--text-secondary)]">{direction}</div>
                      </div>;
                    })}
                  </div>
                </>
              ) : <p className="mt-2 mb-0 text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{comparacaoReteste.reason}</p>}
              {comparacaoNaoSalva && <p role="status" className="mt-3 mb-0 text-[12px] leading-[1.4] text-[color:var(--warning)]">A comparação aparece nesta tela, mas não foi possível salvá-la no histórico local.</p>}
            </section>
          )}

          <div className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
            <h2 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Métricas da medição</h2>
            <div className="mt-4"><FaixaMetricas items={resultadoTrio} variant="resultado" /></div>
          </div>

          <section className="py-7 border-b border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
            <h2 className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Detalhes por tipo de uso e técnicos</h2>
            <details className="mt-3">
            <summary className="cursor-pointer font-medium text-[14px] text-[color:var(--accent)]">Mostrar detalhes técnicos</summary>
            <div className="mt-[18px] grid grid-cols-2 sm:grid-cols-4">
              {(Object.keys(USE_CASE_ICONS) as Array<keyof typeof USE_CASE_ICONS>).map((key) => {
                const veredictoCaso = useCases[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-center gap-1 p-2 border-l border-[color-mix(in_srgb,_var(--border)_14%,_transparent)]"
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: NIVEL_COR[veredictoCaso.nivel] }}
                    >
                      {USE_CASE_ICONS[key]}
                    </span>
                    <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-secondary)] text-center">
                      {USE_CASE_LABELS[key]}
                    </span>
                    <span
                      className="font-medium text-[12px] leading-[1.33]"
                      style={{ color: NIVEL_COR[veredictoCaso.nivel] }}
                    >
                      {veredictoCaso.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 mb-0 font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">Esta é uma leitura das métricas desta medição, não uma certificação da velocidade contratada.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
            <ListaChaveValor
              title="Contexto"
              items={[
                { label: "Infraestrutura", value: result.server },
                { label: "Duração", value: formatarDuracao(result.durationMs) },
                { label: "Data e hora local", value: formatarDataHora(result.timestamp) },
              ]}
            />
            <ListaChaveValor
              title="Detalhes técnicos"
              items={[
                { label: "Jitter", value: result.jitter ? `${result.jitter.ms.toFixed(1)} ms` : "Indisponível" },
                {
                  label: "Bufferbloat",
                  value: `${result.bufferbloat.ms.toFixed(1)} ms · ${BUFFERBLOAT_LABEL[result.bufferbloat.severity]}`,
                },
                { label: "Estabilidade", value: `${result.stabilityScore.toFixed(0)}%` },
                {
                  label: "DNS (DoH)",
                  value: result.dns.latencyMs == null ? "Indisponível" : `${result.dns.latencyMs} ms`,
                },
              ]}
            />
            <p className="sm:col-span-2 mt-1 mb-0 font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">O navegador não confirma provedor, localização, nem lê sinal Wi-Fi ou 4G/5G.</p>
          </div>
            </details>
          </section>

          <a
            href="/como-medimos"
            className="self-center mt-6 font-medium text-[14px] leading-[1.43] text-[color:var(--accent)] no-underline hover:underline"
          >
            Entenda como o teste mede sua conexão
          </a>

          <div className="flex gap-3 mt-6">
            <button
              onClick={statusCompleto ? iniciarReteste : retry}
              className="flex-1 h-[46px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] border-none bg-[color:var(--accent)] hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">refresh</span>
              <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--on-accent)]">
                {statusCompleto ? "Fazer e testar novamente" : "Testar novamente"}
              </span>
            </button>
            <a
              href="/historico"
              className="flex-1 h-[46px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color:var(--border)] no-underline hover:bg-[color:var(--bg-secondary)] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-[color:var(--accent)]">history</span>
              <span className="font-medium text-[14px] leading-[1.43] text-[color:var(--accent)]">Ver histórico</span>
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-[10px] mt-6">
            <button
              onClick={compartilhar}
              className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">share</span>
              <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">Compartilhar</span>
            </button>
            <button
              onClick={copiarResumo}
              className="flex items-center gap-[6px] h-[36px] px-2 border-none bg-transparent cursor-pointer hover:bg-[color:var(--bg-secondary)] rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">content_copy</span>
              <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)]">
                {copiado ? "Copiado!" : "Copiar resumo"}
              </span>
            </button>
          </div>

          {shouldCollectContextualQuestions && (
            <div className="mt-6 pt-6 border-t border-[color-mix(in_srgb,_var(--border)_16%,_transparent)]">
              <GuidedDiagnosis measurementContext={measurementContext} onAnswersChange={setRespostasContextuais} />
            </div>
          )}
        </div>
      )}

      {isIdle && (
        <div className="w-full flex flex-col gap-4 pt-3">
          <div className="flex flex-col gap-[2px] text-center">
            <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
              Diagnóstico, não só velocidade
            </div>
            <h2 className="m-0 font-bold text-[20px] leading-[1.3] text-[color:var(--text-primary)]">
              O SignallQ explica por que, não só quanto
            </h2>
          </div>

          <LinhaChips items={DIAG_ITEMS} />

          <div className="flex flex-wrap items-center gap-4 rounded-[20px] py-5 px-[22px] box-border bg-[linear-gradient(135deg,_color-mix(in_srgb,_var(--accent)_16%,_var(--bg-secondary)),_var(--bg-secondary))] shadow-[0_16px_40px_rgba(0,0,0,.22),_inset_0_1px_0_rgba(255,255,255,.05)]">
            <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1">
              <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
                Só no app SignallQ
              </div>
              <div className="font-semibold text-[16px] leading-[1.35] text-[color:var(--text-primary)]">
                Wi-Fi cômodo a cômodo, sinal móvel e mais
              </div>
              <div className="font-normal text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">
                O navegador não lê rádio Wi-Fi nem sinal 4G/5G. O app mede isso e mostra os dispositivos conectados à
                sua rede.
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
