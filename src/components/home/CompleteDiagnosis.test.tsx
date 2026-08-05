import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import type { SpeedTestResult } from "@/lib/speedEngine";
import { setAdConsent } from "@/lib/adConsent";
import { CompleteDiagnosis } from "./CompleteDiagnosis";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.1): "hierarquia
 * única de conclusão" — CompleteDiagnosis deve ser a única fonte da
 * conclusão/impacto/próxima ação do resultado, exibida como um único h1,
 * nunca duplicada por um segundo bloco de status.
 */

function buildResult(overrides: Partial<SpeedTestResult> = {}): SpeedTestResult {
  return {
    id: "medicao-completa-1",
    timestamp: Date.now(),
    mode: "completo",
    status: "complete",
    download: { mbps: 80, peakMbps: 90 },
    upload: { mbps: 15, peakMbps: 18 },
    latency: { ms: 20, samples: 10, validSamples: 10, timeouts: 0, maxMs: 30, p95Ms: 25, peaks: 0 },
    jitter: { ms: 4 },
    packetLoss: { percent: 0 },
    loadedLatency: null,
    bufferbloat: { ms: 10, severity: "none" },
    stabilityScore: 95,
    dns: {} as never,
    connectionType: "wifi",
    server: "teste",
    partial: false,
    ...overrides,
  };
}

function buildJourney(overrides: Partial<SpeedTestJourney> = {}): SpeedTestJourney {
  const result = overrides.result === undefined ? buildResult() : overrides.result;
  return {
    modo: "completo",
    hasVisibleResult: true,
    result,
    respostaDiagnostica: result
      ? {
          conclusion: "Sua conexão está estável para os principais usos.",
          impact: "Navegação, streaming e chamadas devem funcionar sem oscilação perceptível.",
          nextAction: "Nenhuma ação necessária agora.",
          confidence: "alta",
          version: 1,
        }
      : null,
    retesteBase: null,
    comparacaoReteste: null,
    comparacaoNaoSalva: false,
    shouldCollectContextualQuestions: false,
    measurementContext: null,
    setRespostasContextuais: vi.fn(),
    iniciarReteste: vi.fn(),
    retry: vi.fn(),
    compartilhar: vi.fn(),
    copiarResumo: vi.fn(),
    copiado: false,
    ...overrides,
  } as unknown as SpeedTestJourney;
}

describe("CompleteDiagnosis — hierarquia única de conclusão (#71 §3.1)", () => {
  afterEach(() => cleanup());

  it("mostra a conclusão como único heading e a próxima ação uma única vez, sem barra de status quando a medição está completa", () => {
    render(<CompleteDiagnosis journey={buildJourney()} />);

    const headings = screen.getAllByRole("heading");
    const h1s = headings.filter((node) => node.tagName === "H1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Sua conexão está estável para os principais usos.");

    expect(screen.getAllByText("Próxima ação")).toHaveLength(1);

    // Status "complete" não tem STATUS_MESSAGE associada: nenhuma barra de
    // aviso duplicando o que o h1 já concluiu.
    expect(screen.queryByText("warning", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText(/Completo\./)).not.toBeInTheDocument();
  });

  it("mantém uma única fonte de conclusão mesmo quando a barra de status de atenção aparece (resultado parcial)", () => {
    const journey = buildJourney({ result: buildResult({ status: "partial" }) });
    render(<CompleteDiagnosis journey={journey} />);

    // A barra de status existe (prosa, não heading) e o h1 de conclusão
    // continua sendo o único heading de nível 1 da tela.
    expect(screen.getByText(/Alguma fase não terminou/)).toBeInTheDocument();
    const h1s = screen.getAllByRole("heading").filter((node) => node.tagName === "H1");
    expect(h1s).toHaveLength(1);
  });

  it("não renderiza nada no modo rápido (evita segunda instância de CompleteDiagnosis fora do modo Completo)", () => {
    const { container } = render(<CompleteDiagnosis journey={buildJourney({ modo: "rapido" })} />);
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * Cobertura de integração do único slot de anúncio autorizado (issue #21):
 * confirma que `ResultAdSlot` só aparece dentro de `CompleteDiagnosis`
 * depois do resultado completo e de TODAS as suas ações (reteste,
 * compartilhar, copiar resumo, questionário contextual pós-resultado) —
 * nunca antes, nunca entre elas — e que continua ausente sem consentimento
 * ou com um resultado que não seja `status === "complete"`. Usa import
 * dinâmico (ao contrário do restante deste arquivo) porque precisa de
 * `config.ts` reavaliado com env vars diferentes por teste — mesmo padrão
 * de `AdSenseScript.test.tsx`.
 */
const AD_PUBLISHER_ID = "ca-pub-000000000000000";
const AD_SLOT_ID = "1234567890";

function resetAdEnvAndConsent() {
  vi.unstubAllEnvs();
  vi.resetModules();
  window.localStorage.clear();
}

async function renderCompleteDiagnosisFresh(journey: SpeedTestJourney) {
  const { CompleteDiagnosis: FreshCompleteDiagnosis } = await import("./CompleteDiagnosis");
  return render(<FreshCompleteDiagnosis journey={journey} />);
}

describe("CompleteDiagnosis — posição do slot de anúncio (issue #21)", () => {
  // `resetModules` também antes de cada teste (não só depois): o primeiro
  // teste deste describe roda depois do `import` estático de
  // `CompleteDiagnosis` no topo deste arquivo, então sem isto o `import()`
  // dinâmico devolveria a instância já cacheada (com `config.ts` avaliado
  // sem as env vars stubadas aqui).
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    cleanup();
    resetAdEnvAndConsent();
  });

  it("mostra o slot depois do resultado completo, das ações e do questionário contextual, com consentimento aceito", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", AD_PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");

    await renderCompleteDiagnosisFresh(
      buildJourney({ shouldCollectContextualQuestions: true, measurementContext: { entry: "problem" } as never })
    );

    expect(screen.getByText("Publicidade")).toBeInTheDocument();
    const adSlot = screen.getByTestId("result-ad-slot");
    const repetirButton = screen.getByRole("button", { name: "Testar novamente" });
    const compartilharButton = screen.getByRole("button", { name: "Compartilhar" });
    const contextoDoTeste = screen.getByText("Detalhes do problema");

    // DOCUMENT_POSITION_FOLLOWING (4) confirma que o slot vem depois de cada
    // elemento da jornada crítica, nunca antes ou entre eles.
    expect(repetirButton.compareDocumentPosition(adSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(compartilharButton.compareDocumentPosition(adSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(contextoDoTeste.compareDocumentPosition(adSlot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("não mostra o slot quando o resultado não é 'complete' (parcial), mesmo com consentimento aceito e ações visíveis", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", AD_PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");

    await renderCompleteDiagnosisFresh(buildJourney({ result: buildResult({ status: "partial" }) }));

    expect(screen.getByRole("button", { name: "Testar novamente" })).toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
  });

  it("não mostra o slot sem consentimento decidido, mesmo com resultado completo e ações visíveis", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", AD_PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);

    await renderCompleteDiagnosisFresh(buildJourney());

    expect(screen.getByRole("button", { name: "Testar novamente" })).toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra o slot com consentimento recusado, mesmo com resultado completo e ações visíveis", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", AD_PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("declined");

    await renderCompleteDiagnosisFresh(buildJourney());

    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra o slot no modo 'rapido' (CompleteDiagnosis inteiro não renderiza)", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", AD_PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");

    const { container } = await renderCompleteDiagnosisFresh(buildJourney({ modo: "rapido" }));

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
  });
});
