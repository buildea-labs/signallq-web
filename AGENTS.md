# SignallQ Web

## Identidade e estado atual

- **Organização:** `buildea-labs`
- **Finalidade:** site institucional e PWA do SignallQ para medição de conexão, histórico local e conteúdo explicativo.
- **Classificação:** produto.
- **Estado atual:** aplicação Next.js com App Router, PWA baseada em Serwist, rotas públicas, Route Handlers e validações Vitest.

## Escopo e exclusões

- **Pertence ao repositório:** site público, PWA, medição no navegador, histórico local, páginas institucionais e editoriais, SEO técnico e Route Handlers deste site.
- **Não pertence:** aplicativo Android e Workers do repositório `signallq`, portal administrativo `buildea-admin`, políticas corporativas completas ou projetos pessoais.

## Arquitetura comprovada

- **Componentes principais:** Next.js 16, React 19, TypeScript, Tailwind CSS, `src/app/`, `src/components/`, `src/lib/`, `src/styles/` e `public/`.
- **PWA:** Serwist gera o service worker a partir de `src/app/sw.ts`; `public/manifest.json` define a instalação e `public/sw.js` é o destino gerado.
- **Rotas e dados locais:** App Router e Route Handlers em `src/app/api/`; o histórico é mantido no navegador.
- **Integrações:** medição por endpoints configuráveis, proxies de telemetria e lista de espera, Worker de diagnóstico configurado somente no servidor e AdSense configurável por variável pública. Disponibilidade de serviços externos é a validar.
- **Dependências:** declaradas em `package.json`.

## Comandos essenciais comprovados

- **Instalação:** `npm ci`.
- **Execução:** `npm run dev`.
- **Lint:** `npm run lint`.
- **Typecheck:** `npm run typecheck`.
- **Testes:** `npm test`.
- **Build:** `npm run build`.
- **Validações específicas:** a CI executa instalação, lint, typecheck, testes e build. Alterações de PWA, acessibilidade, SEO técnico ou interface exigem as validações locais aplicáveis em `skills/`.

## Restrições

- **Acessibilidade e performance:** preservar semântica, navegação por teclado, responsividade e desempenho; mudanças de UI devem manter tokens e componentes existentes quando aplicável.
- **Privacidade:** o histórico permanece local; compartilhamento deve preservar somente os dados autorizados. Segredos, incluindo `SITE_INGEST_KEY` e `DIAGNOSTIC_WORKER_URL`, devem permanecer somente no servidor.
- **SEO técnico:** Renan responde por rotas, metadados, redirecionamentos, indexação e dados estruturados. SEO editorial e aquisição pertencem a Marcos.
- **Custos:** mudanças em AdSense, provedores de medição, telemetria, hospedagem ou serviços externos exigem aprovação do Luiz quando criarem custo ou compromisso externo.
- **Publicação:** deploy, produção, alteração pública de marca, rotas públicas, consentimento ou mudança irreversível exigem aprovação explícita do Luiz.

## Agentes aplicáveis

- **Líder funcional:** Claudete.
- **Responsável técnico web:** Renan.
- **Design:** Juliana.
- **Growth e SEO editorial:** Marcos.
- **Operações, métricas e dados:** Gustavo.
- **Revisão independente:** Caio; não implementa a entrega que revisa.
- **Fonte organizacional:** os agentes corporativos canônicos vivem em `../ai-governance/agents/`. Arquivos em `agents/` fornecem contexto específico de execução, mas não substituem a governança organizacional.
- **Skills locais:** `skills/` contém instruções específicas deste repositório.

## Critérios locais de conclusão

- O escopo autorizado foi atendido, os comandos e validações aplicáveis têm evidência, acessibilidade/PWA/SEO técnico foram avaliados quando afetados e Caio revisou mudanças com código, segurança, produção ou risco relevante.

## Fontes complementares

- `README.md`
- `package.json`
- `next.config.ts`
- `.env.example`
- `docs/deploy-vercel.md`
- `skills/quality-gates/SKILL.md`
- `skills/accessibility-seo-review/SKILL.md`
- `skills/pwa-validation/SKILL.md`
- `skills/architecture-guardrails/SKILL.md`
- `../ai-governance/policies/agent-operating-contract.md`
- `../ai-governance/policies/demand-routing.md`
