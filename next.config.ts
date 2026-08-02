import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  // /pro e /teste foram removidas na fase Fundação da reconstrução v4 —
  // redirect 301 preserva links externos/indexados já publicados.
  async redirects() {
    return [
      // Mantém um único host público indexável. O destino absoluto preserva
      // caminho e query string; o redirecionamento permanente é aplicado
      // somente ao host www, sem interferir nas demais rotas ou hosts.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.signallq.com' }],
        destination: 'https://signallq.com/:path*',
        permanent: true,
      },
      { source: "/pro", destination: "/", permanent: true },
      { source: "/teste", destination: "/app", permanent: true },
      // #95 — /quem-somos virou /sobre; preserva link antigo indexado.
      { source: "/quem-somos", destination: "/sobre", permanent: true },
      // #96 — /brand removida da superfície pública.
      { source: "/brand", destination: "/", permanent: true },
      // #97 — /velocidade-e-latencia e /latencia-sob-carga eram placeholders
      // "Em breve"; a jornada real já existe no fluxo de teste principal e
      // nos detalhes técnicos do resultado completo, ambos em "/".
      { source: "/velocidade-e-latencia", destination: "/", permanent: true },
      { source: "/latencia-sob-carga", destination: "/", permanent: true },
      // #98 — /servidores-dns era placeholder "Em breve"; a comparação real
      // de resolvedores DNS agora vive em /dns.
      { source: "/servidores-dns", destination: "/dns", permanent: true },
      // #99 — /modo-gamer era placeholder "Em breve"; a medição real de
      // latência até infraestrutura de jogos agora vive em /jogos.
      { source: "/modo-gamer", destination: "/jogos", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
