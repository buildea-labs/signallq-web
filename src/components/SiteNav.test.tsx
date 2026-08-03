import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteNav } from "./SiteNav";

/**
 * #77 — o item de navegação institucional passa de "Quem somos" para
 * "Sobre o SignallQ" (o rótulo antigo duplicava o nome da rota anterior,
 * /quem-somos, já redirecionada). O href permanece /sobre: só o texto muda.
 * Cobre desktop, mobile (menu aberto via teclado/clique) e leitor de tela
 * (aria-expanded/aria-controls do botão de menu).
 */
vi.mock("next/navigation", () => ({
  usePathname: () => "/sobre",
}));

describe("SiteNav — rótulo institucional (#77)", () => {
  afterEach(() => cleanup());

  it("mostra 'Sobre o SignallQ' apontando para /sobre no menu desktop, e não mostra mais 'Quem somos'", () => {
    render(<SiteNav />);
    const link = screen.getByRole("link", { name: "Sobre o SignallQ" });
    expect(link).toHaveAttribute("href", "/sobre");
    expect(screen.queryByText("Quem somos")).not.toBeInTheDocument();
  });

  it("marca o item 'Sobre o SignallQ' como ativo quando a rota atual é /sobre", () => {
    render(<SiteNav />);
    const link = screen.getByRole("link", { name: "Sobre o SignallQ" });
    expect(link.className).toContain("text-[color:var(--accent)]");
  });

  it("abre o menu mobile por clique e reflete o mesmo rótulo, acessível via teclado", async () => {
    const user = userEvent.setup();
    render(<SiteNav />);

    const toggle = screen.getByRole("button", { name: "Abrir menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const mobileNav = screen.getByRole("navigation", { name: "Navegação do site" });
    const mobileLink = within(mobileNav).getByRole("link", { name: "Sobre o SignallQ" });
    expect(mobileLink).toHaveAttribute("href", "/sobre");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });
});
