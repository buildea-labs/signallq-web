import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Teste de INTEGRAÇÃO do #72 (US 25, primeiro acesso ao Histórico): monta
 * `HistoricoClient` de verdade (não a lógica pura isolada) e exercita os
 * caminhos que a auditoria de Juliana marcou como "atende por inspeção, mas
 * não verificado por teste" — CTA único alcançável por teclado, estado
 * "indisponível" distinto de "vazio", e a correção do Gap A (região
 * `aria-live="polite"` única anunciando a transição carregando -> estado
 * final para leitor de tela).
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const listRecords = vi.fn();
const listComparisons = vi.fn();

vi.mock("@/lib/measurementRepository", () => ({
  listRecords: (...args: unknown[]) => listRecords(...args),
  deleteRecord: vi.fn(),
  clearAll: vi.fn(),
  deleteConnection: vi.fn(),
  updateRecordMetadata: vi.fn(),
}));

vi.mock("@/lib/comparisonRepository", () => ({
  listComparisons: (...args: unknown[]) => listComparisons(...args),
}));

vi.mock("@/lib/sharing", () => ({
  shareMeasurement: vi.fn(),
}));

describe("Histórico — primeiro acesso (#72)", () => {
  beforeEach(() => {
    push.mockClear();
    listRecords.mockReset();
    listComparisons.mockReset();
    listComparisons.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("mostra o estado vazio com uma única ação principal, alcançável e ativável por teclado", async () => {
    listRecords.mockResolvedValue([]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    // Sem atraso artificial: assim que `listRecords` resolve vazio, o texto aparece.
    expect(await screen.findByText("Nenhuma medição ainda")).toBeInTheDocument();

    // Uma única ação principal.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    const cta = screen.getByRole("button", { name: /Testar velocidade/ });

    // Sem texto técnico de armazenamento dentro do estado vazio em si.
    expect(screen.queryByText(/IndexedDB/i)).not.toBeInTheDocument();

    // Alcançável por Tab e ativável por teclado (Enter), não só por clique de mouse.
    await user.tab();
    expect(cta).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("anuncia a transição carregando -> vazio numa única região aria-live, sem duplicar em role=status", async () => {
    listRecords.mockResolvedValue([]);
    const { HistoricoClient } = await import("./HistoricoClient");
    const { container } = render(<HistoricoClient />);

    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    expect(liveRegions).toHaveLength(1);

    const heading = await screen.findByText("Nenhuma medição ainda");
    expect(within(liveRegions[0] as HTMLElement).getByText("Nenhuma medição ainda")).toBe(heading);

    // Gap A pede reaproveito do padrão já existente (role="status" + aria-live já usado
    // em Velocimetro/RetestComparison), não uma segunda região aninhada aqui dentro.
    expect(within(liveRegions[0] as HTMLElement).queryAllByRole("status")).toHaveLength(0);
  });

  it("trata falha de armazenamento como estado distinto de 'vazio', com retry funcional", async () => {
    listRecords.mockRejectedValueOnce(new Error("indexeddb indisponível"));
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    expect(await screen.findByText("Histórico indisponível")).toBeInTheDocument();
    // Não é o mesmo estado/copy do "vazio".
    expect(screen.queryByText("Nenhuma medição ainda")).not.toBeInTheDocument();

    expect(listRecords).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    listRecords.mockResolvedValueOnce([]);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(listRecords).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Nenhuma medição ainda")).toBeInTheDocument();
  });

  it("não menciona login, nuvem ou sincronização em nenhum dos estados iniciais", async () => {
    listRecords.mockResolvedValue([]);
    const { HistoricoClient } = await import("./HistoricoClient");
    const { container } = render(<HistoricoClient />);

    await screen.findByText("Nenhuma medição ainda");
    expect(container.textContent).not.toMatch(/login|nuvem|sincroniza/i);
  });
});
