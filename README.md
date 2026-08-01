# SignallQ Web

Site público do SignallQ para medição de qualidade da conexão, histórico local e conteúdo explicativo sobre desempenho de internet.

## Stack

- Next.js 16, React 19 e TypeScript
- Tailwind CSS 4
- Serwist para service worker e instalação PWA
- Vitest para regras críticas de domínio

## Estrutura

- `src/app/`: rotas App Router e Route Handlers
- `src/components/`: interface reutilizável
- `src/lib/`: motor de medição, classificação, telemetria e SEO
- `src/styles/tokens.css`: tokens visuais usados pelo site
- `public/`: ícones, manifest, imagens e arquivos de SEO

## Rotas

`/` executa o teste de velocidade. O site também oferece `/historico`, `/como-medimos`, `/comparativo`, `/app`, `/brand`, `/privacidade`, `/termos`, `/quem-somos` e páginas editoriais para diagnóstico e jogos. As APIs internas são `POST /api/track` e `POST /api/waitlist`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` quando precisar sobrescrever valores padrão.

- `NEXT_PUBLIC_SIGNALLQ_BETA_DOWNLOAD_URL`
- `NEXT_PUBLIC_SIGNALLQ_TEST_GROUP_URL`
- `NEXT_PUBLIC_SIGNALLQ_CLOSED_TESTING_URL`
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
- `NEXT_PUBLIC_SPEEDTEST_DOWNLOAD_URL`
- `NEXT_PUBLIC_SPEEDTEST_UPLOAD_URL`
- `NEXT_PUBLIC_SPEEDTEST_SERVER_LABEL`
- `NEXT_PUBLIC_SPEEDTEST_LATENCY_URL`
- `SITE_INGEST_KEY` — secret exclusivo do servidor para os Route Handlers; nunca use o prefixo `NEXT_PUBLIC_`.

## Comandos

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## PWA e deploy

O service worker é gerado pelo Serwist a partir de `src/app/sw.ts`. O build produz uma aplicação Next.js pronta para hospedagem compatível com Route Handlers e variáveis de ambiente de servidor. Configure as variáveis no provedor de hospedagem e execute `npm run build` antes da publicação.
