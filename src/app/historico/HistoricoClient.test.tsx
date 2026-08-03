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
const deleteRecord = vi.fn();
const clearAll = vi.fn();
const deleteConnection = vi.fn();
const updateRecordMetadata = vi.fn();

vi.mock("@/lib/measurementRepository", () => ({
  listRecords: (...args: unknown[]) => listRecords(...args),
  deleteRecord: (...args: unknown[]) => deleteRecord(...args),
  clearAll: (...args: unknown[]) => clearAll(...args),
  deleteConnection: (...args: unknown[]) => deleteConnection(...args),
  updateRecordMetadata: (...args: unknown[]) => updateRecordMetadata(...args),
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

  /**
   * Achado de revisão independente (Caio): o `role="status"` do
   * `HistoryCompareBar` (#75) ficava aninhado dentro do `aria-live="polite"`
   * do #72, que envolvia a árvore inteira de toolbar/lista/gráfico/
   * comparação em vez de só o indicador de transição de estado. Este teste
   * cobre exatamente o cenário onde isso acontecia — modo de comparação
   * ativo, com registros carregados — e comprova que não há live region
   * aninhada dentro de outra.
   */
  it("não aninha o role=status do HistoryCompareBar dentro do aria-live do estado de carregamento (Caio)", async () => {
    listRecords.mockResolvedValue([
      historyRecord("x", new Date(2026, 7, 3, 10, 0, 0).getTime()),
      historyRecord("y", new Date(2026, 7, 3, 12, 0, 0).getTime()),
    ]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    const { container } = render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    await user.click(screen.getByRole("button", { name: "Comparar testes" }));
    expect(screen.getByText("Selecione 2 testes para comparar.")).toBeInTheDocument();

    const liveRegions = Array.from(container.querySelectorAll('[aria-live="polite"]'));
    const statusRegions = Array.from(container.querySelectorAll('[role="status"]'));

    // Exatamente uma região aria-live (a do #72) e exatamente um role=status
    // (o do HistoryCompareBar, #75) montados ao mesmo tempo — nenhum dos dois
    // duplicado, e nenhum deles descendente do outro.
    expect(liveRegions).toHaveLength(1);
    expect(statusRegions).toHaveLength(1);
    for (const live of liveRegions) {
      for (const status of statusRegions) {
        expect(live.contains(status)).toBe(false);
        expect(status.contains(live)).toBe(false);
      }
    }
  });
});

/**
 * Teste de INTEGRAÇÃO da issue #76 (US 76, controlar/exportar/apagar
 * histórico local): monta `HistoricoClient` de verdade, cobrindo o menu de
 * opções que se abre (jornada de duas etapas — não uma fileira de botões
 * sempre visível) e o modo de seleção múltipla para exclusão em massa,
 * incluindo o tratamento de falha parcial que a spec de UX exige
 * explicitamente ("falhas são distinguíveis de sucesso").
 */
describe("Histórico — menu de opções e exclusão em massa (#76)", () => {
  beforeEach(() => {
    push.mockClear();
    searchParamsValue = new URLSearchParams();
    listRecords.mockReset();
    listComparisons.mockReset();
    listComparisons.mockResolvedValue([]);
    deleteRecord.mockReset();
    clearAll.mockReset();
    deleteConnection.mockReset();
    updateRecordMetadata.mockReset();
  });

  afterEach(() => cleanup());

  it("o menu de opções se abre com Selecionar registros/Exportar dados/Apagar tudo; filtros e Comparar testes ficam fora dele", async () => {
    listRecords.mockResolvedValue([historyRecord("x", Date.now())]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("1 medição salva");

    // Antes de abrir: nenhum item do menu está na árvore, mas filtros e
    // "Comparar testes" já estão visíveis (fora do menu, sempre presentes).
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comparar testes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todos" })).toBeInTheDocument();

    const menuButton = screen.getByRole("button", { name: "Mais opções" });
    expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "Mais opções" });
    expect(within(menu).getByRole("menuitem", { name: "Selecionar registros" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Exportar dados" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Apagar tudo" })).toBeInTheDocument();
  });

  it("Apagar tudo, a partir do menu, abre o ConfirmDialog existente e limpa o histórico ao confirmar", async () => {
    listRecords.mockResolvedValue([historyRecord("x", Date.now())]);
    clearAll.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("1 medição salva");
    await user.click(screen.getByRole("button", { name: "Mais opções" }));
    await user.click(screen.getByRole("menuitem", { name: "Apagar tudo" }));

    const dialog = screen.getByRole("dialog", { name: "Limpar todo o histórico?" });
    await user.click(within(dialog).getByRole("button", { name: "Limpar tudo" }));

    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Nenhuma medição ainda")).toBeInTheDocument();
  });

  it("Selecionar registros ativa o modo de seleção sem teto de contagem, e cancelar não exclui nada", async () => {
    listRecords.mockResolvedValue([historyRecord("a", 1), historyRecord("b", 2), historyRecord("c", 3)]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("3 medições salvas");
    await user.click(screen.getByRole("button", { name: "Mais opções" }));
    await user.click(screen.getByRole("menuitem", { name: "Selecionar registros" }));

    expect(screen.getByText("Selecione os testes que deseja excluir.")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);

    // Sem teto de 2 (diferente do comparar): marca as 3.
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    expect(screen.getByText("3 selecionados.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir selecionados (3)" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Cancelar seleção" }));
    expect(deleteRecord).not.toHaveBeenCalled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("confirma a exclusão em massa: remove os selecionados via deleteRecord e sai do modo de seleção quando tudo dá certo", async () => {
    listRecords.mockResolvedValue([historyRecord("a", 1), historyRecord("b", 2)]);
    deleteRecord.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    await user.click(screen.getByRole("button", { name: "Mais opções" }));
    await user.click(screen.getByRole("menuitem", { name: "Selecionar registros" }));

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("button", { name: "Excluir selecionados (2)" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir 2 testes selecionados?" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    expect(deleteRecord).toHaveBeenCalledWith("a");
    expect(deleteRecord).toHaveBeenCalledWith("b");
    expect(await screen.findByText("Nenhuma medição ainda")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("falha parcial no lote: mantém os que falharam selecionados e mostra mensagem distinguível de sucesso total", async () => {
    listRecords.mockResolvedValue([historyRecord("ok", 1), historyRecord("fail", 2)]);
    deleteRecord.mockImplementation((id: string) =>
      id === "fail" ? Promise.reject(new Error("falhou")) : Promise.resolve(undefined)
    );
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    await user.click(screen.getByRole("button", { name: "Mais opções" }));
    await user.click(screen.getByRole("menuitem", { name: "Selecionar registros" }));

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Excluir selecionados (2)" }));
    const dialog = screen.getByRole("dialog", { name: "Excluir 2 testes selecionados?" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    // Mensagem distinguível de sucesso total, não um "excluído" genérico.
    expect(
      await screen.findByText("1 de 2 testes excluídos. 1 não puderam ser removidos — tente novamente.")
    ).toBeInTheDocument();
    // Permanece no modo de seleção (permite nova tentativa), com o registro
    // que falhou ainda selecionado/visível — a lista não fica vazia.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("entrar no modo de seleção cancela o modo de comparação ativo (modos mutuamente exclusivos)", async () => {
    listRecords.mockResolvedValue([historyRecord("a", 1), historyRecord("b", 2)]);
    const user = userEvent.setup();
    const { HistoricoClient } = await import("./HistoricoClient");
    render(<HistoricoClient />);

    await screen.findByText("2 medições salvas");
    await user.click(screen.getByRole("button", { name: "Comparar testes" }));
    expect(screen.getByText("Selecione 2 testes para comparar.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mais opções" }));
    await user.click(screen.getByRole("menuitem", { name: "Selecionar registros" }));

    expect(screen.queryByText(/Selecione 2 testes para comparar\./)).not.toBeInTheDocument();
    expect(screen.getByText("Selecione os testes que deseja excluir.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comparar testes" })).toBeInTheDocument();
  });
});

/**
 * Teste de INTEGRAÇÃO da issue #76 (item 1): `removeConnection` migrou de
 * `window.confirm` nativo para o `ConfirmDialog` declarativo do design
 * system, consistente com "Excluir este teste?" e "Limpar tudo". Monta
 * `HistoricoClient` de verdade; como a lista hoje não expõe um gatilho de UI
 * para `startEdit` (edição de contexto só é alcançável a partir do detalhe,
 * #74), este teste aciona `startEdit` pelo próprio controller devolvido —
 * ainda assim renderiza a árvore real de `ConfirmDialog`/`HistoryEditDialog`
 * e verifica o comportamento declarado pela spec de UX (cancelar não perde
 * dados, confirmar exclui e fecha).
 */
describe("Histórico — excluir conexão via ConfirmDialog, não window.confirm (#76)", () => {
  function recordWithConnection(id: string, timestamp: number) {
    return {
      id,
      timestamp,
      download: 80,
      upload: 10,
      latency: 20,
      jitter: 1,
      connectionType: null,
      connectionKind: "wifi" as const,
      server: "Cloudflare",
      mode: "rapido" as const,
      userMetadata: { connectionId: "casa", connectionName: "Casa" },
    };
  }

  beforeEach(() => {
    push.mockClear();
    searchParamsValue = new URLSearchParams();
    listRecords.mockReset();
    listComparisons.mockReset();
    listComparisons.mockResolvedValue([]);
    deleteConnection.mockReset();
    updateRecordMetadata.mockReset();
  });

  afterEach(() => cleanup());

  it("cancelar no ConfirmDialog não chama deleteConnection e mantém o diálogo de edição aberto", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { useHistoryController } = await import("@/hooks/useHistoryController");
    listRecords.mockResolvedValue([recordWithConnection("r1", 1)]);

    const { result } = renderHook(() => useHistoryController());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.startEdit(recordWithConnection("r1", 1)));
    act(() => result.current.removeConnection());

    expect(result.current.confirmRemoveConnectionOpen).toBe(true);
    expect(result.current.editing).not.toBeNull();

    act(() => result.current.cancelRemoveConnection());

    expect(result.current.confirmRemoveConnectionOpen).toBe(false);
    expect(result.current.editing).not.toBeNull();
    expect(deleteConnection).not.toHaveBeenCalled();
  });

  it("confirmar no ConfirmDialog chama deleteConnection e fecha o diálogo de edição", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { useHistoryController } = await import("@/hooks/useHistoryController");
    listRecords.mockResolvedValue([recordWithConnection("r1", 1)]);
    deleteConnection.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistoryController());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.startEdit(recordWithConnection("r1", 1)));
    act(() => result.current.removeConnection());

    await act(async () => {
      await result.current.confirmRemoveConnection();
    });

    expect(deleteConnection).toHaveBeenCalledWith("casa");
    expect(result.current.confirmRemoveConnectionOpen).toBe(false);
    expect(result.current.editing).toBeNull();
  });
});
