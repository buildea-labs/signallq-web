import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teste de DNS e Benchmark | SignallQ",
  description: "Faça o benchmark de servidores DNS como Google, Cloudflare e descubra qual é o mais rápido para a sua conexão.",
  alternates: {
    canonical: "https://signallq.com/dns",
  },
};

export default function DnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}