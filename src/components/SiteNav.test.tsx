import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteNav } from "./SiteNav";

describe("SiteNav — landing pública do app Android", () => {
  afterEach(() => cleanup());

  it("linka o logo para a home e mostra o botão de download da Play Store", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Página inicial SignallQ" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: /Baixar/i })).toBeInTheDocument();
  });
});
