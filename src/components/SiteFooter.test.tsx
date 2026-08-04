import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "./SiteFooter";

/**
 * #77 — rodapé mantém acesso direto às páginas institucionais/legais, com o
 * rótulo "Sobre o SignallQ" (não mais "Quem somos") e um link de Contato
 * (mailto:suporte@signallq.com) que hoje não existe em lugar nenhum do site
 * — gap apontado na auditoria da #77. As duas versões do rodapé (compacta e
 * completa) renderizam juntas no DOM; cada uma tem seus próprios links.
 */
describe("SiteFooter — links institucionais (#77)", () => {
  afterEach(() => cleanup());

  it("aponta 'Sobre o SignallQ' para /sobre nas duas versões do rodapé, sem 'Quem somos' residual", () => {
    render(<SiteFooter />);
    const links = screen.getAllByRole("link", { name: "Sobre o SignallQ" });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/sobre");
    }
    expect(screen.queryByText("Quem somos")).not.toBeInTheDocument();
  });

  it("expõe um link de Contato para suporte@signallq.com nas duas versões do rodapé", () => {
    render(<SiteFooter />);
    const contactLinks = screen.getAllByRole("link", { name: "Contato" });
    expect(contactLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of contactLinks) {
      expect(link).toHaveAttribute("href", "mailto:suporte@signallq.com");
    }
  });

  it("mantém os demais acessos institucionais/legais (Privacidade, Matriz, Termos)", () => {
    render(<SiteFooter />);
    expect(screen.getAllByRole("link", { name: "Política de Privacidade" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Matriz de Privacidade" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Termos de Uso" }).length).toBeGreaterThan(0);
  });
});
