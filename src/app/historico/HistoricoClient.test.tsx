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
let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParamsValue,
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
    searchParamsValue = new URLSearchParams();
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

/**
 * Teste de INTEGRAÇÃO do #75 (US 28, comparar testes): monta `HistoricoClient`
 * de verdade, cobrindo o modo de seleção manual sobre a própria lista —
 * ativar/cancelar, marcar até 2, trocar o mais antigo marcado ao tentar um
 * 3º, o botão "Comparar" só habilitado com exatamente 2, navegação para a
 * rota de comparação com o mais antigo como "a" independente da ordem de
 * clique, e a pré-seleção vinda de `?compare=<id>` (fluxo do detalhe).
 */
function historyRecord(id: string, timestamp: number, download = 80) {
  return {
    id,
    timestamp,
    download,
    upload: 10,
    latency: 20,
    jitter: 1,
    connectionType: null,
    connectionKind: "wifi" as const,
    server: "Cloudflare",
    mode: "rapido" as const,
  };
}

describe("Histórico — seleção manual para comparar testes (#75)", () => {
  beforeEach(() => {
    push.mockClear();
    searchParamsValue = new URLSearchParams();
    listRecords.mockReset();
    listComparisons.mockReset();
    listComparisons.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it("ativa o modo de seleção, marca 2 registros e navega com o mais antigo como 'a'", async () => {
    listRecords.mockResolvedValue([
      historyRecord("mais-novo", new Date(2026, 7, 3, 12, 0, 0).getTime()),
      historyRecord("mais-antigo", new Date(2026, 7, 3, 8, 0, 0).getTime()),
    ]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    await user.click(screen.getByRole("button", { name: "Comparar testes" }));

    // Barra de seleção aparece, botão de confirmar desabilitado com 0/1.
    expect(screen.getByText("Selecione 2 testes para comparar.")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);

    await user.click(checkboxes[0]); // marca o mais-novo primeiro (ordem de renderização: mais recente primeiro)
    expect(screen.getByRole("button", { name: /Comparar \(1/ })).toBeDisabled();
    await user.click(checkboxes[1]); // marca o mais-antigo
    const confirmar = screen.getByRole("button", { name: "Comparar (2 selecionados)" });
    expect(confirmar).toBeEnabled();

    await user.click(confirmar);
    expect(push).toHaveBeenCalledWith("/historico/comparar?a=mais-antigo&b=mais-novo");
  });

  it("ao marcar um 3º registro, desmarca automaticamente o primeiro marcado (troca sem reiniciar)", async () => {
    listRecords.mockResolvedValue([
      historyRecord("c", new Date(2026, 7, 3, 14, 0, 0).getTime()),
      historyRecord("b", new Date(2026, 7, 3, 12, 0, 0).getTime()),
      historyRecord("a", new Date(2026, 7, 3, 10, 0, 0).getTime()),
    ]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("3 medições salvas");
    await user.click(screen.getByRole("button", { name: "Comparar testes" }));

    const checkboxes = screen.getAllByRole("checkbox"); // ordem: c, b, a (mais recente primeiro)
    await user.click(checkboxes[0]); // marca c
    await user.click(checkboxes[1]); // marca b
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    await user.click(checkboxes[2]); // marca a (3º) -> c (o primeiro marcado) sai
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("Cancelar seleção limpa a seleção e sai do modo de seleção", async () => {
    listRecords.mockResolvedValue([historyRecord("x", Date.now())]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("1 medição salva");
    await user.click(screen.getByRole("button", { name: "Comparar testes" }));
    expect(screen.getByRole("checkbox")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Cancelar seleção" })[0]);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    // O item volta a ser um link de navegação normal.
    expect(screen.getByRole("link")).toHaveAttribute("href", "/historico/x");
  });

  it("pré-seleciona o registro vindo de '?compare=<id>' (ação 'Comparar com outro teste' do detalhe)", async () => {
    searchParamsValue = new URLSearchParams("compare=x");
    listRecords.mockResolvedValue([
      historyRecord("x", new Date(2026, 7, 3, 10, 0, 0).getTime()),
      historyRecord("y", new Date(2026, 7, 3, 12, 0, 0).getTime()),
    ]);
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    // Modo de seleção já ativo, sem precisar clicar em "Comparar testes".
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(screen.getByText("1 selecionado — escolha mais 1.")).toBeInTheDocument();
  });
});
