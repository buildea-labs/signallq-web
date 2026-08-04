import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modo Gamer - Avalie sua Conexão para Jogos Online | SignallQ",
  description: "Descubra se a sua internet está boa para jogar Valorant, Free Fire, Fortnite e outros jogos online. Veja a latência e recomendações.",
  alternates: {
    canonical: "https://signallq.com/jogos",
  },
};

export default function JogosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}