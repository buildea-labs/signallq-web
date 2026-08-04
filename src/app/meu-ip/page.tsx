import { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { IpModal } from "@/components/meu-ip/IpModal";
import { PAGE_META } from "@/lib/pageMetaCatalog";

export const metadata: Metadata = {
  title: "Meu IP - Descubra seu Endereço IPv4 e IPv6 | SignallQ",
  description: "Verifique rapidamente o seu endereço de IP público (IPv4 e IPv6) na internet e descubra se a sua conexão está em CGNAT.",
  alternates: {
    canonical: "https://signallq.com/meu-ip",
  },
};

export default function MeuIpPage() {
  return (
    <PageShell align="center" contentMax="860px">
      <IpModal isIntercepted={false} />
    </PageShell>
  );
}
