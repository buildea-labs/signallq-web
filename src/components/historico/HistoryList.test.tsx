import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoryList } from "@/components/historico/HistoryList";
import { groupRecordsByPeriod } from "@/lib/historySelectors";
import type { MedicaoRegistro } from "@/lib/measurementRepository";

/**
 * Teste de INTEGRAÇÃO do #73 (US 26, lista agrupada por período): monta
 * `HistoryList` + `HistoryListItem` + `HistoryRecordCard` de verdade
 * (não a lógica pura isolada), cobrindo os critérios de aceite que só são
 * verificáveis montando os componentes: cabeçalhos de período na ordem
 * certa (sem grupo vazio), conteúdo do item sem métricas em excesso,
 * ausência de botões de ação inline, registro legado sem campos opcionais
 * continua acessível sem valores inventados, e o item inteiro é um único
 * alvo de navegação alcançável por teclado.
 */

const DIA = 24 * 60 * 60 * 1000;
const AGORA = new Date(2026, 7, 3, 15, 0, 0).getTime(); // 2026-08-03 15:00 local

const record = (overrides: Partial<MedicaoRegistro> & { id: string; timestamp: number }): MedicaoRegistro => ({
  download: 87.3,
  upload: 12.4,
  latency: 18,
  jitter: null,
  connectionType: null,
  connectionKind: "wifi",
  server: "Cloudflare",
  mode: "rapido",
  ...overrides,
});

describe("HistoryList — lista agrupada por período (#73)", () => {
  afterEach(() => cleanup());

  it("mostra cabeçalhos de período na ordem certa, omitindo grupos vazios", () => {
    const records = [
      record({ id: "hoje", timestamp: AGORA - 2 * 60 * 60 * 1000 }), // hoje, 2h atrás
      record({ id: "semana", timestamp: AGORA - 4 * DIA }), // esta semana
      record({ id: "antigo", timestamp: AGORA - 30 * DIA }), // anteriores
    ];
    const groups = groupRecordsByPeriod(records, AGORA);

    render(<HistoryList groups={groups} filteredCount={records.length} totalCount={records.length} />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Hoje (1)", "Esta semana (1)", "Anteriores (1)"]);
    // "Ontem" não aparece: não há cabeçalho sem itens embaixo.
    expect(screen.queryByText(/^Ontem/)).not.toBeInTheDocument();
  });

  it("ordena os itens de cada grupo em ordem cronológica decrescente", () => {
    const records = [
      record({ id: "mais-antigo-hoje", timestamp: AGORA - 6 * 60 * 60 * 1000 }),
      record({ id: "mais-novo-hoje", timestamp: AGORA - 1 * 60 * 60 * 1000 }),
    ];
    const groups = groupRecordsByPeriod(records, AGORA);
    render(<HistoryList groups={groups} filteredCount={records.length} totalCount={records.length} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/historico/mais-novo-hoje",
      "/historico/mais-antigo-hoje",
    ]);
  });

  it("mostra download, modo e problema informado quando existem, e nada de métricas extras/ações inline", async () => {
    const withEverything = record({
      id: "completo",
      timestamp: AGORA - 30 * 60 * 1000,
      mode: "completo",
      userMetadata: { reportedProblem: "Vídeo trava toda vez que chove muito forte aqui em casa" },
    });
    const groups = groupRecordsByPeriod([withEverything], AGORA);
    render(<HistoryList groups={groups} filteredCount={1} totalCount={1} />);

    const item = screen.getByRole("link");
    expect(within(item).getByText("87.3 Mbps")).toBeInTheDocument();
    expect(within(item).getByText(/Completo/)).toBeInTheDocument();
    // truncado com reticências, não o texto completo.
    expect(within(item).getByText(/…$/)).toBeInTheDocument();
    expect(within(item).queryByText("Vídeo trava toda vez que chove muito forte aqui em casa")).not.toBeInTheDocument();

    // upload/latência não aparecem na lista (só no detalhe, #74).
    expect(within(item).queryByText(/12\.4/)).not.toBeInTheDocument();
    expect(within(item).queryByText(/18\s*ms/)).not.toBeInTheDocument();

    // Nenhum botão de ação inline (editar/compartilhar/excluir saíram da lista).
    expect(within(item).queryAllByRole("button")).toHaveLength(0);
  });

  it("registro legado sem mode/userMetadata continua acessível sem inventar valores", () => {
    const legacy = record({ id: "legado", timestamp: AGORA - 20 * 60 * 1000, mode: undefined, userMetadata: undefined });
    const groups = groupRecordsByPeriod([legacy], AGORA);
    render(<HistoryList groups={groups} filteredCount={1} totalCount={1} />);

    const item = screen.getByRole("link");
    expect(within(item).getByText("87.3 Mbps")).toBeInTheDocument();
    // Nenhum placeholder de modo desconhecido nem "Completo" inventado.
    expect(within(item).queryByText(/Rápido|Completo/)).not.toBeInTheDocument();
  });

  it("cada item é um único alvo de navegação, alcançável e ativável por teclado", async () => {
    const user = userEvent.setup();
    const records = [record({ id: "abc123", timestamp: AGORA - 10 * 60 * 1000 })];
    const groups = groupRecordsByPeriod(records, AGORA);
    render(<HistoryList groups={groups} filteredCount={1} totalCount={1} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/historico/abc123");

    await user.tab();
    expect(link).toHaveFocus();
  });

  it("mostra o par vinculado inline, na posição do registro mais recente, sem seção fixa no topo (#75)", () => {
    const before = record({ id: "antes", timestamp: AGORA - 2 * DIA, diagnostic: { conclusion: "x", confidence: "y", nextAction: "Aproxime-se do roteador.", contractVersion: 1 } });
    const after = record({ id: "depois", timestamp: AGORA - 60 * 60 * 1000 });
    const groups = groupRecordsByPeriod([before, after], AGORA);
    const byId = new Map([
      [before.id, before],
      [after.id, after],
    ]);
    const linkedPairByAfterId = new Map([[after.id, { id: "cmp-1", createdAt: AGORA, beforeId: before.id, afterId: after.id, mode: "rapido" as const }]]);

    render(<HistoryList groups={groups} filteredCount={2} totalCount={2} linkedPairByAfterId={linkedPairByAfterId} byId={byId} />);

    expect(screen.getByText(/Vinculado a um teste anterior/)).toBeInTheDocument();
    expect(screen.getByText(/Aproxime-se do roteador\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver comparação" })).toHaveAttribute(
      "href",
      "/historico/comparar?a=antes&b=depois"
    );
  });

  it("modo de seleção (#75): item vira checkbox marcável em vez de link de navegação", async () => {
    const user = userEvent.setup();
    const records = [record({ id: "sel-1", timestamp: AGORA - 10 * 60 * 1000 })];
    const groups = groupRecordsByPeriod(records, AGORA);
    const onToggleSelect = vi.fn();
    render(
      <HistoryList
        groups={groups}
        filteredCount={1}
        totalCount={1}
        selectable
        selectedIds={[]}
        onToggleSelect={onToggleSelect}
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith("sel-1");
  });
});
