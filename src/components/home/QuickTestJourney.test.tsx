import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { withDerivedJourneyState } from "@/test/fixtures/speedTestJourney";
import { setAdConsent } from "@/lib/adConsent";
import { quickResultFixture } from "@/test/fixtures/speedTestResults";
import { QuickTestJourney } from "./QuickTestJourney";

vi.mock("@/hooks/useNetworkInfo", () => ({
  useNetworkInfo: () => ({ isp: null, region: null, loading: false }),
}));

function buildJourney(overrides: Partial<SpeedTestJourney> = {}): SpeedTestJourney {
  return withDerivedJourneyState({
    phase: "idle",
    liveValue: 0,
    result: null,
    isIdle: true,
    isRunning: false,
    isProblem: false,
    isResult: false,
    isAutoStarting: true,
    showDial: true,
    modo: "rapido",
    terminalOutcome: null,
    measurementContext: null,
    sheetDiagnosticoAberto: false,
    redeDeclarada: null,
    postResultProblem: null,
    postResultAnswers: [],
    postResultFlowState: null,
    notaAprofundamentoCancelado: false,
    iniciarTesteDireto: vi.fn(),
    iniciarAprofundamento: vi.fn(),
    abrirSheetDiagnostico: vi.fn(),
    fecharSheetDiagnostico: vi.fn(),
    declararRede: vi.fn(),
    confirmarDiagnostico: vi.fn(),
    selecionarProblemaPosResultado: vi.fn(),
    atualizarRespostasPosResultado: vi.fn(),
    setRespostasContextuais: vi.fn(),
    cancelTest: vi.fn(),
    ...overrides,
  });
}

/**
 * Jornada do protótipo: a rota entra medindo. Não existe tela ociosa com
 * seletor de modo nem declaração de problema antes da medição — o único
 * caminho declarado é o sheet sobre o resultado rápido.
 */
describe("QuickTestJourney — entrada sem tela ociosa (protótipo, tela 1.1)", () => {
  afterEach(() => cleanup());

  it("na formação, mostra só o preparo — nenhum controle compete com a medição que já começou", () => {
    render(<QuickTestJourney journey={buildJourney()} />);

    expect(screen.getByText("Preparando sua medição…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rápido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Completo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Testar agora" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Minha internet está com problema" })).not.toBeInTheDocument();
  });

  it("no resultado rápido, o contexto é opcional e o teste completo é alcançável sem responder nada", async () => {
    const user = userEvent.setup();
    const abrirSheetDiagnostico = vi.fn();
    const iniciarAprofundamento = vi.fn();
    render(
      <QuickTestJourney
        journey={buildJourney({
          phase: "concluido",
          isIdle: false,
          isAutoStarting: false,
          isResult: true,
          result: quickResultFixture,
          terminalOutcome: "complete",
          abrirSheetDiagnostico,
          iniciarAprofundamento,
        })}
      />
    );

    // Nenhum questionário na própria tela: ele vive no sheet.
    expect(screen.queryByText("Você está tendo algum problema agora?")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Problemas com a sua internet/ }));
    expect(abrirSheetDiagnostico).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Fazer teste completo" }));
    expect(iniciarAprofundamento).toHaveBeenCalledTimes(1);
  });

  it("abre o sheet de diagnóstico com os dois grupos declaráveis", () => {
    render(
      <QuickTestJourney
        journey={buildJourney({
          phase: "concluido",
          isIdle: false,
          isAutoStarting: false,
          isResult: true,
          result: quickResultFixture,
          terminalOutcome: "complete",
          sheetDiagnosticoAberto: true,
        })}
      />
    );

    const sheet = screen.getByRole("dialog", { name: "Diagnosticar minha internet" });
    expect(sheet).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Rede" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Problema" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Wi-Fi" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Está lenta" })).toBeInTheDocument();
  });

  it("na falha, oferece as duas saídas do protótipo", () => {
    render(
      <QuickTestJourney
        journey={buildJourney({
          phase: "endpoint-indisponivel",
          isIdle: false,
          isAutoStarting: false,
          isProblem: true,
        })}
      />
    );

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Verificar conexão" })).toHaveAttribute("href", "/ping");
  });

  it("sem conexão, não oferece verificar conexão — não há o que verificar offline", () => {
    render(
      <QuickTestJourney
        journey={buildJourney({ phase: "sem-conexao", isIdle: false, isAutoStarting: false, isProblem: true })}
      />
    );

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Verificar conexão" })).not.toBeInTheDocument();
  });
});

/**
 * Cobertura do único slot de anúncio autorizado (issue #21): a jornada
 * crítica de medição (rodando, em estado de problema/erro) nunca inclui o
 * slot — `QuickTestJourney` simplesmente não importa `ResultAdSlot`, então
 * mesmo com publisher id, slot id e consentimento aceito configurados, o
 * rótulo "Publicidade" não pode aparecer em nenhum desses estados.
 */
describe("QuickTestJourney — nunca mostra o slot de anúncio durante teste/diagnóstico (issue #21)", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  function stubFullAdConfig() {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", "ca-pub-000000000000000");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", "1234567890");
    setAdConsent("accepted");
  }

  it("não mostra 'Publicidade' com o teste em andamento (isRunning)", () => {
    stubFullAdConfig();
    render(
      <QuickTestJourney
        journey={buildJourney({ isIdle: false, isAutoStarting: false, isRunning: true, phase: "download" })}
      />
    );
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra 'Publicidade' em estado de problema/erro (isProblem)", () => {
    stubFullAdConfig();
    render(
      <QuickTestJourney
        journey={buildJourney({ isIdle: false, isAutoStarting: false, isProblem: true, phase: "sem-conexao" })}
      />
    );
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra 'Publicidade' durante a formação, antes de qualquer resultado", () => {
    stubFullAdConfig();
    render(<QuickTestJourney journey={buildJourney()} />);
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
  });
});
