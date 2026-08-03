import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setAdConsent } from "../lib/adConsent";

/**
 * Cobertura de componente do único slot de anúncio autorizado (issue #21):
 * o slot nunca renderiza sem publisher id + slot id configurados, nunca
 * renderiza sem consentimento explicitamente aceito (nem "não decidiu" nem
 * "recusou" deixam espaço reservado visível), e só quando tudo isso é
 * verdadeiro é que aparece com o rótulo "Publicidade", a unidade do AdSense
 * e um contêiner com dimensão reservada (para não causar CLS).
 */

const PUBLISHER_ID = "ca-pub-000000000000000";
const AD_SLOT_ID = "1234567890";

function resetEnvAndConsent() {
  vi.unstubAllEnvs();
  vi.resetModules();
  window.localStorage.clear();
}

describe("ResultAdSlot — configuração ausente", () => {
  afterEach(() => {
    cleanup();
    resetEnvAndConsent();
  });

  it("não renderiza sem NEXT_PUBLIC_ADSENSE_PUBLISHER_ID, mesmo com slot id e consentimento aceitos", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", "");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");
    const { ResultAdSlot } = await import("./ResultAdSlot");
    render(<ResultAdSlot />);
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
    expect(screen.queryByText("Publicidade")).not.toBeInTheDocument();
  });

  it("não renderiza sem NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT, mesmo com publisher id e consentimento aceitos", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", "");
    setAdConsent("accepted");
    const { ResultAdSlot } = await import("./ResultAdSlot");
    render(<ResultAdSlot />);
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
  });
});

describe("ResultAdSlot — consentimento ausente ou recusado", () => {
  afterEach(() => {
    cleanup();
    resetEnvAndConsent();
  });

  it("não renderiza (nem espaço reservado) quando o consentimento ainda não foi decidido", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    const { ResultAdSlot } = await import("./ResultAdSlot");
    const { container } = render(<ResultAdSlot />);
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("não renderiza (nem espaço reservado) quando o consentimento foi recusado", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("declined");
    const { ResultAdSlot } = await import("./ResultAdSlot");
    const { container } = render(<ResultAdSlot />);
    expect(screen.queryByTestId("result-ad-slot")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ResultAdSlot — publisher id, slot id e consentimento aceito", () => {
  afterEach(() => {
    cleanup();
    resetEnvAndConsent();
  });

  it("renderiza o rótulo 'Publicidade', a unidade do AdSense e reserva dimensão fixa", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");
    const { ResultAdSlot } = await import("./ResultAdSlot");
    render(<ResultAdSlot />);

    expect(screen.getByTestId("result-ad-slot")).toBeInTheDocument();
    expect(screen.getByText("Publicidade")).toBeInTheDocument();

    const ins = document.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins).toHaveAttribute("data-ad-client", PUBLISHER_ID);
    expect(ins).toHaveAttribute("data-ad-slot", AD_SLOT_ID);

    // Espaço reservado (evita CLS) já presente no mesmo render em que o
    // `<ins>` aparece — não depende do anúncio real ter carregado.
    const frame = screen.getByTestId("result-ad-slot-frame");
    expect(frame).toHaveStyle({ aspectRatio: "336 / 280" });
  });

  it("não é formatado como botão/resultado: o rótulo é texto simples, sem role de botão/link", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");
    const { ResultAdSlot } = await import("./ResultAdSlot");
    render(<ResultAdSlot />);

    const label = screen.getByText("Publicidade");
    expect(label.tagName.toLowerCase()).toBe("span");
    expect(screen.queryByRole("button", { name: "Publicidade" })).not.toBeInTheDocument();
  });

  it("solicita o anúncio ao AdSense (push em window.adsbygoogle) exatamente uma vez ao montar", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_PUBLISHER_ID", PUBLISHER_ID);
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_RESULT_AD_SLOT", AD_SLOT_ID);
    setAdConsent("accepted");
    const w = window as typeof window & { adsbygoogle?: unknown[] };
    delete w.adsbygoogle;
    const { ResultAdSlot } = await import("./ResultAdSlot");
    render(<ResultAdSlot />);

    expect(w.adsbygoogle).toHaveLength(1);
  });
});
