import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

/**
 * Teste de INTEGRAÇÃO do #75 (US 28, comparar testes): monta
 * `HistoryCompareResult` de verdade — a mesma tela que atende tanto a
 * seleção manual quanto o link "Ver comparação" de um par já vinculado —
 * cobrindo: diferença correta para testes compatíveis, explicação clara para
 * incompatíveis/legados (sem inventar conclusão), estado de parâmetros
 * ausentes/registro não encontrado, e ordenação antes/depois por timestamp
 * independente da ordem dos ids na URL.
 */

const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

const getRecordById = vi.fn();
vi.mock("@/lib/measurementRepository", () => ({
  getRecordById: (...args: unknown[]) => getRecordById(...args),
}));

function record(overrides: Partial<MedicaoRegistro> = {}): MedicaoRegistro {
  return {
    id: "a",
    timestamp: new Date(2026, 7, 1, 10, 0, 0).getTime(),
    download: 80,
    upload: 10,
    latency: 20,
    jitter: 1,
    connectionType: null,
    connectionKind: "wifi",
    server: "Cloudflare",
    mode: "rapido",
    ...overrides,
  };
}

describe("HistoryCompareResult — comparação entre testes salvos (#75)", () => {
  beforeEach(() => {
    back.mockClear();
    getRecordById.mockReset();
  });

  afterEach(() => cleanup());

  it("mostra a diferença correta e matemática entre dois testes compatíveis, mais antigo como 'antes'", async () => {
    const antigo = record({ id: "antigo", timestamp: new Date(2026, 7, 1, 10, 0, 0).getTime(), download: 80, mode: "rapido" });
    const novo = record({ id: "novo", timestamp: new Date(2026, 7, 2, 10, 0, 0).getTime(), download: 100, mode: "rapido" });
    // Ids na URL propositalmente fora de ordem cronológica (a=novo, b=antigo).
    getRecordById.mockImplementation((id: string) => Promise.resolve(id === "novo" ? novo : antigo));
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId="novo" bId="antigo" />);

    expect(await screen.findByText("100.0 Mbps")).toBeInTheDocument();
    expect(screen.getByText(/Antes: 80.0/)).toBeInTheDocument();
    expect(screen.getByText(/\+20.0 Mbps/)).toBeInTheDocument();
    expect(screen.getByText("Melhor nesta medição")).toBeInTheDocument();
  });

  it("mostra o motivo, sem inventar conclusão, quando os modos diferem", async () => {
    const a = record({ id: "a", timestamp: 1000, mode: "rapido" });
    const b = record({ id: "b", timestamp: 2000, mode: "completo" });
    getRecordById.mockImplementation((id: string) => Promise.resolve(id === "a" ? a : b));
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId="a" bId="b" />);

    expect(await screen.findByText("Os dois testes precisam usar o mesmo modo.")).toBeInTheDocument();
    expect(screen.queryByText(/Melhor nesta medição|Pior nesta medição/)).not.toBeInTheDocument();
  });

  it("mostra o motivo específico quando um dos registros é legado (sem mode salvo)", async () => {
    const legacy = record({ id: "legado", timestamp: 1000, mode: undefined });
    const current = record({ id: "atual", timestamp: 2000, mode: "rapido" });
    getRecordById.mockImplementation((id: string) => Promise.resolve(id === "legado" ? legacy : current));
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId="legado" bId="atual" />);

    expect(
      await screen.findByText(/Não é possível confirmar que os dois testes usaram o mesmo modo/)
    ).toBeInTheDocument();
  });

  it("mostra estado distinto quando faltam parâmetros, sem tentar carregar nada", async () => {
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId={undefined} bId="b" />);

    expect(await screen.findByText("Selecione dois testes salvos para comparar.")).toBeInTheDocument();
    expect(getRecordById).not.toHaveBeenCalled();
  });

  it("mostra estado distinto quando um dos ids não existe, sem redirecionar silenciosamente", async () => {
    getRecordById.mockImplementation((id: string) => Promise.resolve(id === "a" ? record({ id: "a" }) : null));
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId="a" bId="excluido" />);

    expect(
      await screen.findByText("Um dos testes selecionados não foi encontrado. Ele pode ter sido excluído.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao Histórico" })).toHaveAttribute("href", "/historico");
  });

  it("o botão Voltar usa router.back()", async () => {
    const a = record({ id: "a", timestamp: 1000 });
    const b = record({ id: "b", timestamp: 2000 });
    getRecordById.mockImplementation((id: string) => Promise.resolve(id === "a" ? a : b));
    const { HistoryCompareResult } = await import("./HistoryCompareResult");
    render(<HistoryCompareResult aId="a" bId="b" />);

    await screen.findAllByText("Sem mudança");
    (await screen.findByRole("button", { name: "Voltar" })).click();
    expect(back).toHaveBeenCalledTimes(1);
  });
});
