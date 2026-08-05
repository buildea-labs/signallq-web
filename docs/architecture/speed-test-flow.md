# Speed Test Flow

## Responsabilidades

- `useSpeedTestController`: executa o motor, fases, cancelamento, lock entre abas, guarda de rede e resultado bruto.
- `useSpeedTest`: fachada da medição; associa contexto de sessão ao controller.
- `useSpeedTestJourney`: composition hook da Home; orquestra modo, entrada por problema, reteste, diagnóstico pós-resultado e ações.
- `speedTestVisualState`: função pura que deriva o estado visual a partir de fase, modo e resultado existentes. Não cria fonte de verdade paralela.
- `speedTestJourneySession`: lê/grava somente o resultado completo restaurável e o marcador de autostart em `sessionStorage`.
- `speedTestJourneyComparison`: calcula e persiste comparação de reteste.
- `speedTestJourneySharing`: encapsula compartilhamento e cópia do resumo.
- `src/test/fixtures/speedTestResults.ts`: massas determinísticas com `SpeedTestResult` real. Área exclusiva de teste — código de aplicação não pode importá-las (regra `no-restricted-imports` em `eslint.config.mjs`).
- `e2e-visual/`: baseline visual dos nove estados, exercitando a Home real. Não existe rota nem componente de harness dentro de `src/app`.

## Fonte De Verdade

A fonte funcional continua sendo `phase`, `result`, `measurementContext` e `modo`, vindos de `useSpeedTest` e da jornada. O estado visual é derivado por `deriveSpeedTestVisualState`; componentes não devem adicionar novos booleanos para representar telas quando o estado puder ser derivado dessas entradas.

## Fluxo De Dados

`HomeClient` compõe `useSpeedTestJourney` e passa contratos para os componentes da Home. A execução entra por `useSpeedTestJourney -> useSpeedTest -> useSpeedTestController -> speedEngine`. Resultados completos persistem no histórico pelo controller e ficam restauráveis pela sessão da jornada. Retestes geram comparação por `speedTestJourneyComparison`. Compartilhar/copiar passa por `speedTestJourneySharing`.

## Protótipos Catalogados

Fonte inspecionada: `docs/prototypes/SignallQ - Protótipos de Tela.zip` — artefato de design local, deliberadamente não versionado (binário de ~750 KB, fora do escopo deste repositório de código). O que importa para a implementação está catalogado abaixo.

Conteúdo catalogado: `SignallQ Speed Flow.dc.html`, `Speedometer.dc.html`, frames Android/iOS/browser e assets de marca/ilustração. Estados futuros preparados no tipo visual: `forming`, `quick-running`, `quick-result`, `full-running`, `diagnosing`, `full-result`, `restored-result`, `error`, `offline`.

## Pontos De Extensão

- Adaptar layout e aparência futura nos componentes existentes, consumindo `visualState`.
- Usar fixtures para testes de caracterização antes de alterar telas.
- Capturar cada estado com `npm run test:visual` antes/depois da implementação 1:1.

## Baseline Visual

`npm run test:visual` (config `playwright.visual.config.ts`, testDir `e2e-visual/`) percorre os nove estados na Home real e grava as capturas em `test-results/speed-test-flow-baseline/`. Não há rota de harness, componente de depuração nem atributo de teste no bundle da Home: os estados são alcançados por `sessionStorage` (mesmas chaves que a aplicação grava), interceptação de rede do Playwright nas quatro origens externas do motor e interação pelos mesmos textos e papéis que a pessoa usuária vê. Determinismo é de estado, não de pixel — os números vêm do motor real sobre transporte simulado.

Regra estrutural: nada em `src/app` pode importar `src/test/**`. Foi esse caminho que fez as fixtures serem emitidas em `.next/static/chunks` pelo harness anterior — `notFound()` é checagem de runtime e não impede o bundler de atravessar a fronteira `"use client"`. A regra de lint em `eslint.config.mjs` transforma a reincidência em erro de lint.

Estado `error`: a baseline captura a fase `cancelado`. As demais fases de problema (`endpoint-indisponivel`, `conexao-interrompida`, `erro-inesperado`) não são alcançáveis pela Home hoje — `collectLatency` e `runThroughput` absorvem toda falha de requisição, então uma indisponibilidade do endpoint termina como resultado `inconclusive`/`partial`, nunca como fase de problema. Pendência registrada, fora do escopo desta preparação.

## Não Duplicar Ou Reescrever

- Não criar árvores separadas mobile/PWA/desktop.
- Não duplicar motor, diagnóstico, histórico, telemetria ou persistência.
- Não mover `gaugeMath` nem alterar comportamento funcional do `Velocimetro`.
- Não trocar props por contexto global.
- Não adicionar Redux, Zustand, XState, Storybook ou nova biblioteca de estado.
