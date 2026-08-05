import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
import { withDerivedJourneyState } from "@/test/fixtures/speedTestJourney";
import { setAdConsent } from "@/lib/adConsent";
import { MODO_EXPLICACAO } from "./homeCopy";
import { QuickTestJourney } from "./QuickTestJourney";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.3/§3.4.7): o
 * parágrafo permanente que explicava a diferença entre os modos Rápido e
 * Completo virou ajuda sob demanda via `HelpButton` — não deve haver texto
 * fixo competindo com a decisão principal (escolher o modo).
 */

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
    isAutoStarting: false,
    showDial: true,
    modo: "rapido",
    setModo: vi.fn(),
    terminalOutcome: null,
    entradaProblemaAberta: false,
    problemaPercebido: null,
    abrirEntradaPorProblema: vi.fn(),
    fecharEntradaPorProblema: vi.fn(),
    selecionarProblema: vi.fn(),
    iniciarTesteComProblema: vi.fn(),
    iniciarTesteDireto: vi.fn(),
    shouldResumeContextualQuestions: false,
    measurementContext: null,
    setRespostasContextuais: vi.fn(),
    ...overrides,
  });
}

describe("QuickTestJourney — explicação de modo sob demanda (#71 §3.3/§3.4.7)", () => {
  afterEach(() => cleanup());

  it("não mostra o texto de explicação dos modos permanentemente", () => {
    render(<QuickTestJourney journey={buildJourney()} />);
    expect(screen.queryByText(MODO_EXPLICACAO.rapido)).not.toBeInTheDocument();
    expect(screen.queryByText(MODO_EXPLICACAO.completo)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "O que muda entre os modos?" })).toBeInTheDocument();
  });

  it("mostra a explicação do modo atual só após clicar no botão de ajuda, e some ao clicar de novo", async () => {
    const user = userEvent.setup();
    render(<QuickTestJourney journey={buildJourney({ modo: "rapido" })} />);
    const helpButton = screen.getByRole("button", { name: "O que muda entre os modos?" });

    await user.click(helpButton);
    expect(screen.getByText(MODO_EXPLICACAO.rapido)).toBeInTheDocument();

    await user.click(helpButton);
    expect(screen.queryByText(MODO_EXPLICACAO.rapido)).not.toBeInTheDocument();
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
        journey={buildJourney({ isIdle: false, isRunning: true, showDial: true, phase: "download" }) as never}
      />
    );
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra 'Publicidade' em estado de problema/erro (isProblem)", () => {
    stubFullAdConfig();
    render(
      <QuickTestJourney
        journey={
          buildJourney({
            isIdle: false,
            isProblem: true,
            showDial: true,
            phase: "sem-conexao",
          }) as never
        }
      />
    );
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });

  it("não mostra 'Publicidade' na tela ociosa (idle), antes de qualquer resultado", () => {
    stubFullAdConfig();
    render(<QuickTestJourney journey={buildJourney()} />);
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
  });
});
