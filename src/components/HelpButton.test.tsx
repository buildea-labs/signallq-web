import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { HelpButton } from "./HelpButton";

/**
 * Cobertura de componente da claim estrutural de #71 (§3.3/§3.4.7): ajuda
 * contextual passa a ser sob demanda — nenhum texto de ajuda deve ficar
 * permanentemente visível; ele só aparece depois de um clique explícito no
 * botão "?", e desaparece ao alternar de novo. `HelpButton` é controlado
 * pelo chamador, então o teste usa um wrapper mínimo com estado real,
 * igual ao padrão usado em `ResultTechnicalDetails`/`QuickTestJourney`.
 */

function ControlledHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <HelpButton
      text="Explicação sob demanda, nunca fixa na tela."
      label="O que é isso?"
      open={open}
      onToggle={() => setOpen((current) => !current)}
    />
  );
}

describe("HelpButton — ajuda sob demanda (#71 §3.3/§3.4.7)", () => {
  afterEach(() => cleanup());

  it("não mostra o texto de ajuda permanentemente ao montar", () => {
    render(<ControlledHelpButton />);
    expect(screen.queryByText("Explicação sob demanda, nunca fixa na tela.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "O que é isso?" })).toHaveAttribute("aria-expanded", "false");
  });

  it("mostra o texto apenas após clicar, e o esconde de novo ao clicar outra vez", async () => {
    const user = userEvent.setup();
    render(<ControlledHelpButton />);
    const button = screen.getByRole("button", { name: "O que é isso?" });

    await user.click(button);
    expect(screen.getByText("Explicação sob demanda, nunca fixa na tela.")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(screen.queryByText("Explicação sob demanda, nunca fixa na tela.")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
