import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SpeedTestJourney } from "@/hooks/useSpeedTestJourney";
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
  return {
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
  } as unknown as SpeedTestJourney;
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
