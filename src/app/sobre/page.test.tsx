import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PAGE_META } from "../../lib/pageMetaCatalog";
import Page from "./page";

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
