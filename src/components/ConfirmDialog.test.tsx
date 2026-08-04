import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Teste de INTEGRAÇÃO do achado de acessibilidade da spec de UX do #76
 * (seção 4): o componente genérico `ConfirmDialog` não tinha foco
 * programático ao abrir nem fechamento por Esc, diferente do
 * `HistoryEditDialog` vizinho — um gap que deixou de ser cosmético quando
 * #76 passou a introduzir duas novas instâncias deste diálogo (excluir
 * conexão, excluir em lote). Corrigido uma única vez aqui, beneficia todos
 * os usos existentes e novos.
 */
describe("ConfirmDialog — foco e Esc (#76)", () => {
  afterEach(() => cleanup());

  it("recebe foco programático ao abrir", () => {
    render(
      <ConfirmDialog
        icon="delete"
        title="Excluir este teste?"
        description="Remove esta medição salva neste navegador. Não é possível desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Excluir este teste?" })).toHaveFocus();
  });

  it("Esc chama onCancel, equivalente a clicar em Cancelar", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        icon="delete"
        title="Excluir este teste?"
        description="Remove esta medição salva neste navegador. Não é possível desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
