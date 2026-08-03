import { cleanup, render, screen, within } from "@testing-library/react";
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

/**
 * #79 — "O que o SignallQ faz" (Web vs. Android). A antiga seção
 * "Site/PWA e Android" (um único parágrafo) vira uma lista simples de 4
 * capacidades, com link contextual para /privacidade na capacidade de
 * histórico local, seguida de uma frase explícita sobre recursos que
 * dependem do aplicativo Android, com link para /app.
 */
describe("página /sobre — o que o SignallQ faz (#79)", () => {
  it("lista as 4 capacidades como itens de uma lista simples, não como card por capacidade", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "O que o SignallQ faz" });
    expect(heading).toBeInTheDocument();
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const list = section?.querySelector("ul");
    expect(list).not.toBeNull();
    const items = list ? Array.from(list.querySelectorAll("li")) : [];
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toContain("Medir a conexão");
    expect(items[1].textContent).toContain("Interpretar os resultados em linguagem simples");
    expect(items[2].textContent).toContain("Aprofundar a análise quando há indício de um problema");
    expect(items[3].textContent).toContain("Manter um histórico local");
  });

  it("inclui um link contextual para /privacidade na capacidade de histórico local", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "O que o SignallQ faz" });
    const section = heading.closest("section");
    const link = section
      ? within(section).getByRole("link", { name: "Privacidade" })
      : null;
    expect(link).toHaveAttribute("href", "/privacidade");
  });

  it("explica que recursos nativos podem depender do Android, com link para /app", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "O que o SignallQ faz" });
    const section = heading.closest("section");
    expect(section?.textContent).toContain("sinal Wi‑Fi");
    expect(section?.textContent).toContain("rede móvel");
    const link = section
      ? within(section).getByRole("link", { name: "aplicativo Android" })
      : null;
    expect(link).toHaveAttribute("href", "/app");
  });

  it("não recria a antiga seção de parágrafo único 'Site/PWA e Android'", () => {
    render(<Page />);
    expect(screen.queryByRole("heading", { name: "Site/PWA e Android" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/São experiências complementares/),
    ).not.toBeInTheDocument();
  });

  it("mantém um único CTA final na página, sem duplicar botão para esta seção", () => {
    render(<Page />);
    const ctas = screen.getAllByRole("link", { name: "Testar minha internet" });
    expect(ctas).toHaveLength(1);
    expect(ctas[0]).toHaveAttribute("href", "/");
  });
});

/**
 * #80 — "Medição não é adivinhação": seção curta e nova que explica que o
 * SignallQ separa medição, sinal de possível problema e ausência de dados
 * suficientes, usando o vocabulário real do motor de diagnóstico (parcial,
 * inconclusivo, confiança baixa), com um único link contextual para
 * /como-medimos.
 */
describe("página /sobre — medição não é adivinhação (#80)", () => {
  it("renderiza o título e a seção logo após 'O que o SignallQ faz'", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Medição não é adivinhação" });
    expect(heading).toBeInTheDocument();

    const previous = screen.getByRole("heading", { level: 2, name: "O que o SignallQ faz" });
    const headings = screen.getAllByRole("heading", { level: 2 });
    const previousIndex = headings.indexOf(previous);
    const currentIndex = headings.indexOf(heading);
    expect(currentIndex).toBe(previousIndex + 1);
  });

  it("usa vocabulário consistente com o motor de diagnóstico real (parcial, inconclusivo, confiança baixa)", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Medição não é adivinhação" });
    const section = heading.closest("section");
    expect(section?.textContent).toContain("parcial");
    expect(section?.textContent).toContain("inconclusivo");
    expect(section?.textContent).toContain("confiança baixa");
    expect(section?.textContent).toContain(
      "separa o que foi medido, o que é um sinal de possível problema e quando não há dados suficientes para concluir",
    );
    expect(section?.textContent).not.toMatch(/descobre[a-z]* (sempre|toda) a causa/i);
  });

  it("inclui um único link contextual para /como-medimos dentro da seção", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Medição não é adivinhação" });
    const section = heading.closest("section");
    const link = section
      ? within(section).getByRole("link", { name: "Como medimos" })
      : null;
    expect(link).toHaveAttribute("href", "/como-medimos");
    const links = section ? within(section).getAllByRole("link") : [];
    expect(links).toHaveLength(1);
  });

  it("não usa múltiplos blocos visuais separados para medição/hipótese/limite", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Medição não é adivinhação" });
    const section = heading.closest("section");
    const paragraphs = section ? section.querySelectorAll("p") : [];
    expect(paragraphs).toHaveLength(1);
  });
});

/**
 * #81 — "Desenvolvido pela Buildea": identifica a mantenedora, separa o
 * estágio por plataforma (Web/PWA e Android, sem frase única combinada),
 * expõe contato oficial (mailto) e um único link contextual para /termos.
 * Substitui a antiga seção "O que fazemos", que misturava mantenedora,
 * estágio e descrição funcional (já coberta por #79).
 */
describe("página /sobre — desenvolvido pela Buildea (#81)", () => {
  it("identifica a Buildea como mantenedora inequivocamente", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Desenvolvido pela Buildea" });
    expect(heading).toBeInTheDocument();
    const section = heading.closest("section");
    expect(section?.textContent).toContain("Desenvolvido pela Buildea.");
    expect(screen.queryByRole("heading", { name: "O que fazemos" })).not.toBeInTheDocument();
  });

  it("mostra o estágio separado por plataforma, sem frase única combinada", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Desenvolvido pela Buildea" });
    const section = heading.closest("section");
    expect(section?.textContent).toContain("SignallQ Web/PWA: disponível em beta.");
    expect(section?.textContent).toContain("Aplicativo SignallQ Android: em teste fechado.");
    expect(section?.textContent).not.toContain(
      "O teste web está disponível em beta; o aplicativo Android está em teste fechado.",
    );
  });

  it("expõe contato oficial suporte@signallq.com como link mailto funcional", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Desenvolvido pela Buildea" });
    const section = heading.closest("section");
    const contact = section
      ? within(section).getByRole("link", { name: "suporte@signallq.com" })
      : null;
    expect(contact).toHaveAttribute("href", "mailto:suporte@signallq.com");
  });

  it("inclui um único link contextual para /termos, sem outro link secundário", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Desenvolvido pela Buildea" });
    const section = heading.closest("section");
    const termosLink = section
      ? within(section).getByRole("link", { name: "Termos" })
      : null;
    expect(termosLink).toHaveAttribute("href", "/termos");
    const links = section ? within(section).getAllByRole("link") : [];
    expect(links).toHaveLength(2); // mailto de contato + /termos
  });

  it("não menciona dado pessoal, equipe, escritório, prêmio ou número de uso", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { level: 2, name: "Desenvolvido pela Buildea" });
    const section = heading.closest("section");
    expect(section?.textContent).not.toMatch(/produto independente desenvolvido no Brasil/i);
    expect(section?.textContent).not.toMatch(/equipe|escritório|prêmio|usuários ativos/i);
  });
});
