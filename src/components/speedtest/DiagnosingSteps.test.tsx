import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DiagnosingSteps } from "./DiagnosingSteps";

/**
 * Tela 2.3 do protótipo. O progresso é derivado da fase real do motor — a
 * lista não pode declarar concluída uma etapa que a medição não fez, nem
 * ficar presa numa etapa que já passou.
 */
describe("DiagnosingSteps — etapas do diagnóstico", () => {
  afterEach(() => cleanup());

  it("marca como concluídas apenas as etapas anteriores à fase corrente", () => {
    render(<DiagnosingSteps phase="upload" onCancel={vi.fn()} />);

    expect(screen.getByText(/Tempo de resposta/)).toHaveTextContent("(concluído)");
    expect(screen.getByText(/Velocidade de download/)).toHaveTextContent("(concluído)");
    expect(screen.getByText(/Velocidade de upload/)).toHaveTextContent("(em andamento)");
    expect(screen.getByText(/Análise da rede/)).toHaveTextContent("(aguardando)");
  });

  it("na fase de processamento, só a análise segue em andamento", () => {
    render(<DiagnosingSteps phase="processando" onCancel={vi.fn()} />);

    expect(screen.getByText(/Velocidade de upload/)).toHaveTextContent("(concluído)");
    expect(screen.getByText(/Análise da rede/)).toHaveTextContent("(em andamento)");
  });

  it("mantém o cancelamento explícito disponível", async () => {
    const onCancel = vi.fn();
    render(<DiagnosingSteps phase="processando" onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancelar teste" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
