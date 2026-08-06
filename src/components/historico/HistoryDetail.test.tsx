import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

/**
 * Teste de INTEGRAÇÃO do #74 (US 27, detalhe de teste salvo): monta
 * `HistoryDetail` de verdade — abrindo um registro "clicado" a partir da
 * lista (id na rota) — e verifica a hierarquia obrigatória da spec de UX:
 * resultado principal (Velocímetro estático) antes de tudo, data/modo,
 * interpretação salva (conclusão + confiança no lugar de "impact", que nunca
 * existe no Histórico), problema informado/próxima ação só quando existirem,
 * aviso de versão anterior para registros legados, detalhes técnicos
 * recolhidos por padrão, e as 3 ações que saíram da lista (#73) reaparecendo
 * aqui — nunca a ação de comparação, que depende do #75 (fora de escopo).
 */

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
}));

const getRecordById = vi.fn();
const listRecords = vi.fn();
const updateRecordMetadata = vi.fn();
const deleteRecord = vi.fn();
const deleteConnection = vi.fn();

vi.mock("@/lib/measurementRepository", () => ({
  getRecordById: (...args: unknown[]) => getRecordById(...args),
  listRecords: (...args: unknown[]) => listRecords(...args),
  updateRecordMetadata: (...args: unknown[]) => updateRecordMetadata(...args),
  deleteRecord: (...args: unknown[]) => deleteRecord(...args),
  deleteConnection: (...args: unknown[]) => deleteConnection(...args),
}));

const shareMeasurement = vi.fn();
vi.mock("@/lib/sharing", () => ({
  shareMeasurement: (...args: unknown[]) => shareMeasurement(...args),
}));

function record(overrides: Partial<MedicaoRegistro> = {}): MedicaoRegistro {
  return {
    id: "rec-1",
    timestamp: new Date(2026, 7, 3, 14, 30, 0).getTime(),
    download: 87.3,
    upload: 12.6,
    latency: 18.4,
    jitter: 3.2,
    connectionType: null,
    connectionKind: "wifi",
    server: "Cloudflare",
    mode: "completo",
    diagnostic: { conclusion: "Sua conexão está estável.", confidence: "Confiança alta.", nextAction: "Repita se perceber lentidão.", contractVersion: 1 },
    ...overrides,
  };
}

describe("HistoryDetail — detalhe de teste salvo (#74)", () => {
  beforeEach(() => {
    push.mockClear();
    back.mockClear();
    getRecordById.mockReset();
    listRecords.mockReset();
    listRecords.mockResolvedValue([]);
    updateRecordMetadata.mockReset();
    deleteRecord.mockReset();
    deleteConnection.mockReset();
    shareMeasurement.mockReset();
  });

  afterEach(() => cleanup());

  it("mostra o resultado principal, data/modo e a interpretação salva antes dos detalhes técnicos", async () => {
    getRecordById.mockResolvedValue(record());
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    // Resultado principal (Velocímetro estático): valor + unidade + rótulo da métrica.
    expect(await screen.findByText("87.3")).toBeInTheDocument();
    expect(screen.getByText("Mbps")).toBeInTheDocument();
    expect(screen.getAllByText("Download").length).toBeGreaterThan(0);

    // Data + modo.
    expect(screen.getAllByText(/Completo/).length).toBeGreaterThan(0);

    // Interpretação: conclusão como título, confiança no lugar do "impact"
    // (que nunca é persistido no Histórico).
    expect(screen.getByRole("heading", { name: "Sua conexão está estável." })).toBeInTheDocument();
    expect(screen.getByText("Confiança alta.")).toBeInTheDocument();

    // Próxima ação (existe no diagnostic salvo).
    expect(screen.getByText("Repita se perceber lentidão.")).toBeInTheDocument();

    // Detalhes técnicos recolhidos por padrão.
    const details = screen.getByText("Ver detalhes da medição").closest("details");
    expect(details).not.toHaveAttribute("open");

    // Sem aviso de versão anterior para um registro completo/atual.
    expect(screen.queryByText(/versão anterior/)).not.toBeInTheDocument();

    // Ações: editar/compartilhar/excluir voltaram a existir aqui (#73 as tirou da lista).
    expect(screen.getByRole("button", { name: /Editar contexto/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compartilhar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Excluir/ })).toBeInTheDocument();
    // #75: "Comparar com outro teste" pré-seleciona este registro na lista.
    expect(screen.getByRole("link", { name: /Comparar com outro teste/ })).toHaveAttribute(
      "href",
      "/historico?compare=rec-1"
    );
  });

  it("mostra o aviso de versão anterior quando mode ou diagnostic estão ausentes, sem inventar dados", async () => {
    getRecordById.mockResolvedValue(record({ mode: undefined, diagnostic: undefined }));
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    expect(await screen.findByText(/versão anterior do histórico/)).toBeInTheDocument();
    // Sem título/confiança fabricados quando não há diagnostic salvo.
    expect(screen.getByText("Este teste não tem uma leitura de diagnóstico salva.")).toBeInTheDocument();
    // Sem seção de problema/próxima ação, já que nenhuma das duas existe.
    expect(screen.queryByText("Próxima ação")).not.toBeInTheDocument();
    // Sem rótulo de modo inventado.
    expect(screen.queryByText(/Rápido|Completo/)).not.toBeInTheDocument();
  });

  it("mostra um estado distinto de 'não encontrado' quando o id não existe, sem redirecionar silenciosamente", async () => {
    getRecordById.mockResolvedValue(null);
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="apagado" />);

    expect(await screen.findByText("Este teste não foi encontrado. Ele pode ter sido excluído.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao Histórico" })).toHaveAttribute("href", "/historico");
    expect(push).not.toHaveBeenCalled();
  });

  it("o botão Voltar usa navegação de histórico do navegador (router.back), preservando contexto", async () => {
    getRecordById.mockResolvedValue(record());
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("excluir pede confirmação e, ao confirmar, chama deleteRecord e volta", async () => {
    getRecordById.mockResolvedValue(record());
    deleteRecord.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: /Excluir/ }));
    const dialog = screen.getByRole("dialog", { name: "Excluir este teste?" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    expect(deleteRecord).toHaveBeenCalledWith("rec-1");
    expect(back).toHaveBeenCalled();
  });

  it("compartilhar envia as métricas e a leitura salva, nunca dados locais adicionais", async () => {
    getRecordById.mockResolvedValue(record());
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: /Compartilhar/ }));

    expect(shareMeasurement).toHaveBeenCalledWith({
      timestamp: record().timestamp,
      downloadMbps: 87.3,
      uploadMbps: 12.6,
      latencyMs: 18.4,
      conclusion: "Sua conexão está estável.",
      nextAction: "Repita se perceber lentidão.",
    });
  });

  it("editar contexto abre o diálogo existente e salva via updateRecordMetadata", async () => {
    getRecordById.mockResolvedValue(record());
    updateRecordMetadata.mockResolvedValue(record({ userMetadata: { connectionName: "Casa" } }));
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: /Editar contexto/ }));
    expect(screen.getByRole("dialog", { name: "Contexto da conexão" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(updateRecordMetadata).toHaveBeenCalledWith("rec-1", expect.any(Object));
  });

  /**
   * #76, item 1: `removeConnection` migrou de `window.confirm` nativo para
   * o `ConfirmDialog` declarativo do design system — mesmo padrão de
   * "Excluir este teste?"/"Limpar tudo". Ambas as instâncias (lista e
   * detalhe) precisavam mudar; este arquivo cobre a de `HistoryDetail`.
   */
  it("excluir esta conexão abre o ConfirmDialog (não window.confirm); cancelar não chama deleteConnection e mantém a edição aberta", async () => {
    getRecordById.mockResolvedValue(record({ userMetadata: { connectionId: "casa", connectionName: "Casa" } }));
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: /Editar contexto/ }));
    await user.click(screen.getByRole("button", { name: "Excluir esta conexão" }));

    const dialog = screen.getByRole("dialog", { name: "Excluir esta conexão?" });
    expect(dialog).toHaveTextContent(
      "Remove todas as medições e comparações associadas a este local, salvas neste navegador."
    );
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(deleteConnection).not.toHaveBeenCalled();
    // O diálogo de edição continua aberto (a spec de UX permite mantê-lo
    // atrás; cancelar volta ao estado anterior sem perda de dados digitados).
    expect(screen.getByRole("dialog", { name: "Contexto da conexão" })).toBeInTheDocument();
  });

  it("excluir esta conexão: confirmar chama deleteConnection e volta para a tela anterior", async () => {
    getRecordById.mockResolvedValue(record({ userMetadata: { connectionId: "casa", connectionName: "Casa" } }));
    deleteConnection.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { HistoryDetail } = await import("./HistoryDetail");
    render(<HistoryDetail id="rec-1" />);

    await screen.findByText("87.3");
    await user.click(screen.getByRole("button", { name: /Editar contexto/ }));
    await user.click(screen.getByRole("button", { name: "Excluir esta conexão" }));

    const dialog = screen.getByRole("dialog", { name: "Excluir esta conexão?" });
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));

    expect(deleteConnection).toHaveBeenCalledWith("casa");
    expect(back).toHaveBeenCalled();
  });
});
