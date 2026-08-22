import { Banda } from "@/components/Banda";
import { Metadata } from "next";
import { IpModal } from "@/components/meu-ip/IpModal";

export const metadata: Metadata = {
  title: "Meu IP - Descubra seu Endereço IPv4 e IPv6 | SignallQ",
  description: "Verifique rapidamente o seu endereço de IP público (IPv4 e IPv6) na internet e descubra se a sua conexão está em CGNAT.",
  alternates: {
    canonical: "https://signallq.com/meu-ip",
  },
};

export default function MeuIpPage() {
  return (
    <Banda className="py-8 md:py-12 lg:py-16">
      <IpModal isIntercepted={false} />
    </Banda>
  );
}
