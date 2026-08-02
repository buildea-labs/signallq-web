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
    ];
  },
};

export default withSerwist(nextConfig);
