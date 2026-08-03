import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PAGE_META } from "../../lib/pageMetaCatalog";
import Page from "./page";

afterEach(() => cleanup());

/**
 * #77 — CTA final da página e metadados de /sobre. O rótulo do CTA muda de
 * "Medir minha conexão" para "Testar minha internet" (href continua /); o
 * title/description do catálogo deixam de repetir o nome antigo da rota
 * ("Quem somos") e passam a refletir a rota canônica /sobre.
 */
describe("página /sobre — CTA e metadados (#77)", () => {
  it("usa o rótulo 'Testar minha internet' no CTA final, apontando para /", () => {
    render(<Page />);
    const cta = screen.getByRole("link", { name: "Testar minha internet" });
    expect(cta).toHaveAttribute("href", "/");
    expect(screen.queryByText("Medir minha conexão")).not.toBeInTheDocument();
  });

  it("define title/description de /sobre sem repetir o rótulo antigo 'Quem somos'", () => {
    const meta = PAGE_META["/sobre"];
    expect(meta.title).toBe("Sobre o SignallQ");
    expect(meta.title).not.toContain("Quem somos");
    expect(meta.description).toContain("SignallQ");
  });
});

/**
 * #78 — Hero e bloco "Por que existimos". O H1 passa a ser o próprio nome
 * da rota ("Sobre o SignallQ"), sem overline redundante, com a frase de
 * propósito aprovada como único resumo. O bloco de problema/objetivo
 * genérico anterior ("Da medida para a ação") é substituído por um único
 * parágrafo de propósito, sem missão/visão/valores corporativos.
 */
describe("página /sobre — hero e propósito (#78)", () => {
  it("usa 'Sobre o SignallQ' como H1, sem overline, com a frase de propósito aprovada", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 1, name: "Sobre o SignallQ" });
    expect(heading).toBeInTheDocument();
    expect(screen.queryByText("Quem somos")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Criamos o SignallQ para ajudar qualquer pessoa a entender melhor a própria internet.",
      ),
    ).toBeInTheDocument();
  });

  it("não tem CTA nem link dentro do cabeçalho (hero só com título e resumo)", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 1, name: "Sobre o SignallQ" });
    const header = heading.closest("header");
    expect(header).not.toBeNull();
    expect(header && header.querySelectorAll("a, button").length).toBe(0);
  });

  it("explica a diferença entre mostrar números e interpretar o resultado, sem promessa absoluta", () => {
    render(<Page />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Por que existimos" }),
    ).toBeInTheDocument();
    const paragraph = screen.getByText(/Testes tradicionais de velocidade mostram números/);
    expect(paragraph.textContent).toContain(
      "não explicam o que eles significam para quem está usando a internet",
    );
    expect(paragraph.textContent).toContain("sem prometer descobrir toda causa");
  });

  it("não recria a antiga seção genérica 'Da medida para a ação' nem a frase de objetivo institucional", () => {
    render(<Page />);
    expect(screen.queryByText("Da medida para a ação")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Tornar diagnósticos de rede mais compreensíveis e acionáveis/),
    ).not.toBeInTheDocument();
  });
});
