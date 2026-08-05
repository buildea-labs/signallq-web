# Fluxo de Velocidade — implementação do protótipo (web mobile, PWA e desktop)

**Repositório:** `buildea-labs/signallq-web` · **Branch:** `feat/prototipos-webapp-desktop`

Fonte visual: `docs/prototypes/SignallQ - Protótipos de Tela.zip` (arquivo local,
não versionado, não alterado nesta rodada) — telas `SignallQ Speed Flow.dc.html`
(WebApp 1.1–1.5 e 2.1–2.4; Desktop 1.1–1.3, 2.1–2.2) e `Speedometer.dc.html`.

Fonte funcional: o código já existente — motor de medição, diagnóstico,
persistência, histórico, telemetria, consentimento, compartilhamento,
restauração e reteste seguem intactos.

---

## 1. Mapa protótipo → componentes

| Protótipo | Estado visual (`SpeedTestVisualState`) | Componentes |
| --- | --- | --- |
| 1.1 Entrada e formação do velocímetro | `forming` | `QuickTestJourney` → `QuickResult` → `Velocimetro` (mode `forming`, sem número, sem escala) + linha "Preparando sua medição…" |
| 1.2 Teste rápido em execução | `quick-running` | `QuickResult` (`Velocimetro` mode `measuring`) + `TestRunning` → `MeasurementStatusLine` + "Cancelar teste" |
| 1.3 Resultado do teste rápido | `quick-result` | `ResultStamp` + `Velocimetro` (mode `settled`, rótulo `Download`) + `PostResultProblemPrompt` + `QuickResultDetails` + `HomeProductContext` (Ferramentas) |
| 1.4 Falha na medição | `error` | `AlertScreen` (ícone em círculo, título, ação primária) |
| 1.5 Sem conexão | `offline` | `AlertScreen` (tom de erro, ícone `wifi_off`) |
| 2.1 Seleção do motivo | — (não é estado próprio) | `PostResultProblemPrompt` — chips de problema no próprio fluxo, ver §5.2 |
| 2.2 Teste completo em execução | `full-running` | `QuickResult` + `TestRunning` com o passo "1 de 2 · Download" / "2 de 2 · Upload" |
| 2.3 Processando diagnóstico | `full-running` na fase `processando` | `DiagnosingSteps` (lista de etapas derivada da fase real do motor) |
| 2.4 Resultado completo com diagnóstico | `full-result` / `diagnosing` | `CompleteDiagnosis` (overline "Diagnóstico" + conclusão) → `FullResultMetrics` → `UseCaseSummary` → `ResultTechnicalDetails` → ações → `HomeProductContext` → `ResultAdSlot` |
| Desktop 1.1 Painel de velocidade | `forming` / `*-running` / `quick-result` | Mesma árvore; `PageShell align="center"` + `layout.contentMax` |
| Desktop 2.1 Diagnóstico completo | `full-result` | `FullResultMetrics` vira grade de 4 tiles a partir de `lg` |
| Desktop 1.2/1.3 e 2.2 | `error` / `offline` / `processando` | Mesmos componentes, mesma composição |
| Último resultado restaurado | `restored-result` | `ResultStamp` "Último resultado · …" + mostrador (rápido) ou diagnóstico (completo) |

## 2. Componentes reaproveitados (sem substituição)

`HomeClient`, `PageShell`, `useSpeedTestJourney`, `deriveSpeedTestVisualState`,
`useSpeedTest`, `useSpeedTestController`, `QuickTestJourney`, `QuickResult`,
`TestRunning`, `CompleteDiagnosis`, `ProblemPrompt`, `PostResultProblemPrompt`,
`Velocimetro`, `gaugeMath`, `speedometerView`, `speedometerIdentity`,
`problemStates`, `homeCopy`, `UseCaseSummary`, `ResultTechnicalDetails`,
`RetestComparison`, `GuidedDiagnosis`, `ResultAdSlot`, `HomeProductContext`,
`speedTestJourneySession`, `speedTestJourneyComparison`,
`speedTestJourneySharing`, `classification`, fixtures e baseline visual
existentes.

Nenhuma biblioteca nova. Nenhum Redux/Zustand/XState/Storybook. Nenhuma
segunda jornada paralela: continua existindo uma única árvore funcional,
responsiva, alimentada pelo mesmo hook.

## 3. Componentes criados

| Arquivo | Papel |
| --- | --- |
| `src/lib/speedTestLayout.ts` | Função pura `speedTestLayoutFor(visualState, phase)` → `{ stage, dial, contentMax }`. Layout é consequência do estado visual, não uma segunda decisão dentro dos componentes. |
| `src/components/speedtest/MeasurementStatusLine.tsx` | Ponto pulsante + frase da fase corrente (`aria-live`), com passo opcional. |
| `src/components/speedtest/ResultStamp.tsx` | Selo de procedência do resultado ("Teste rápido · Executado agora", "Último resultado · …"). |
| `src/components/speedtest/AlertScreen.tsx` | Tela cheia de falha/offline: círculo com ícone, título, descrição, ações. |
| `src/components/speedtest/DiagnosingSteps.tsx` | Lista de etapas do processamento do diagnóstico, derivada da fase real. |
| `src/components/home/FullResultMetrics.tsx` | Hierarquia de métricas do resultado completo (+ `buildFullResultMetrics`, puro). |
| `src/components/home/QuickResultDetails.tsx` | "Detalhes da medição" do resultado rápido (disclosure curto). |
| `src/hooks/usePrefersReducedMotion.ts` | Lê `prefers-reduced-motion` para o mostrador, que interpola em JavaScript. |
| `src/test/fixtures/speedTestJourney.ts` | `withDerivedJourneyState` — dublês de jornada com `visualState`/`layout` derivados pelas funções reais. |

## 4. Arquivos alterados

- `src/lib/gaugeMath.ts` — geometria do mostrador do protótipo: `dialCurve`
  (`t^0.78`), `dialPolar`/`dialAngle`/`dialArcPath` (cx 150, cy 170, r 125,
  início 188°, varredura 196°), `dialAutoMax`, `dialScaleSet`,
  `dialScaleForPhase`, `dialTickLabel`, `dialMajorTicks`, `dialMinorTicks`.
  Todas as funções antigas continuam exportadas.
- `src/components/Velocimetro.tsx` — reescrito para o desenho do protótipo
  (trilho discreto, arco ativo com pontas arredondadas, halo pulsante,
  marcador luminoso com anel, ponteiro fino com pivô, escala adaptativa,
  número tabular dentro do SVG). Ganhou os modos `forming | measuring |
  settled | restored | error | quiet` e os props opcionais `hideValue` e
  `showScale`; a API antiga continua válida.
- `src/components/home/QuickResult.tsx` — passou a decidir mostrador, selo e
  cor a partir de `journey.layout` / `journey.visualState`.
- `src/components/home/QuickTestJourney.tsx` — composição por estado visual;
  falha/offline agora usam `AlertScreen`; CTA de repouso saiu de dentro do
  mostrador.
- `src/components/home/TestRunning.tsx` — passo + linha de estado do
  protótipo; na fase `processando` do modo Completo, delega a
  `DiagnosingSteps`.
- `src/components/home/CompleteDiagnosis.tsx` — diagnóstico lidera a tela;
  `FullResultMetrics` + `UseCaseSummary` logo abaixo; botão de reteste
  contornado, como no protótipo.
- `src/components/home/HomeProductContext.tsx` — seção "Ferramentas" em
  cartões baixos com descrição.
- `src/components/home/homeCopy.ts` — `DIAG_ITEMS` ganhou `description`.
- `src/components/home/speedometerView.ts` — número central inteiro
  (`formatDialNumber`), como no protótipo.
- `src/components/home/ProblemPrompt.tsx`, `PostResultProblemPrompt.tsx` —
  chips e CTA no acabamento do protótipo; o CTA passou a se chamar
  "Fazer teste completo".
- `src/hooks/useSpeedTestJourney.ts` — expõe `layout`; `shellAlign` passou a
  derivar dele.
- `src/app/HomeClient.tsx` — `contentMax` vem de `layout`.
- `src/app/layout.tsx` — `<main>` virou coluna flex com `flex-1`, para que
  `PageShell align="center"` tenha altura para centralizar.
- `src/index.css` — animações do mostrador (`sq-dial-*`) e do ponto de
  estado, todas neutralizadas em `prefers-reduced-motion`.
- `src/components/historico/HistoryDetail.tsx` — usa `mode="quiet"` (leitura
  arquivada não "se forma" agora).
- `.gitignore` — ignora `docs/prototypes/` (arquivo local do Luiz).
- Testes: ver §8.

## 5. Decisões arquiteturais e divergências registradas

### 5.1 Layout derivado, não decidido na UI
`speedTestLayoutFor` traduz cada um dos nove estados em `stage`/`dial`/
`contentMax`. Sem isso, cada componente reinventaria a regra de "quando o
velocímetro sai de cena" — a segunda fonte de verdade que o protótipo torna
inevitável (telas 2.3 e 2.4 não têm mostrador).

### 5.2 As perguntas de contexto ficam no fluxo, não num sheet modal
O protótipo (tela 2.1) abre um *bottom sheet* sobre o resultado. A
implementação mantém os mesmos elementos (título curto, chips, CTA) **no
próprio fluxo da página**. Motivos: sem trava de foco/scroll-lock, sem
portal, sem segunda URL para o mesmo resultado — que é justamente a razão
que o próprio protótipo dá para não usar página dedicada. Divergência
consciente de forma, não de conteúdo.

### 5.3 Ferramentas: três, não quatro
O protótipo mostra quatro cartões (Ping, DNS, Meu IP, Jogos). Não existe rota
de Ping neste repositório e criar páginas novas de ferramentas está fora do
escopo desta rodada. A grade responde ao número real de ferramentas em vez de
reservar um espaço vazio ou inventar uma página.

### 5.4 Tipografia: uma família só
O protótipo usa `Sora` para display e `Plus Jakarta Sans` para texto. O
repositório tem regra explícita de fonte única (`src/styles/tokens.css`:
"nenhuma segunda família em nenhuma tela"). Foram adotados os **pesos,
tamanhos, tracking e hierarquia** do protótipo sobre `Google Sans Flex`.
Nenhuma fonte nova foi baixada.

### 5.5 Cor do arco
Medindo: sempre o accent, como no protótipo. As cores por fase do motor
(verde no download, âmbar no upload) faziam o arco trocar de cor no meio da
mesma medição sem que nada tivesse piorado. Assentado: a cor vem da
classificação do download (`classifyDownload`), não do fato de o teste ter
terminado — atende diretamente ao "não usar verde só porque o teste acabou".

### 5.6 Resultado rápido continua só com download
O painel desktop do protótipo (`desktop-1`, "Resultado do teste") mostra
Upload/Ping/Servidor sob o rótulo "Teste rápido". Isso contradiz o contrato
funcional ("resultado rápido apenas com download", e a rodada rápida não mede
upload). O contrato funcional venceu; o desktop mostra a mesma leitura do
mobile.

### 5.7 "Processando diagnóstico" é uma fase, não um estado terminal
A tela 2.3 do protótipo corresponde à fase `processando` do modo Completo,
não ao estado `diagnosing` de `SpeedTestVisualState` (que já é um resultado
completo com aprofundamento). A lista de etapas é renderizada na fase real; o
estado `diagnosing` continua sendo o resultado completo com a conclusão
contextual.

### 5.8 Mostrador escala por CSS, não por degraus de `size`
O protótipo troca espessuras e tamanhos de fonte em degraus de `size` (250,
300, 340, 356). Aqui o desenho inteiro vive na viewBox 300×206 e escala com o
contêiner — uma implementação só para todas as larguras, sem tabela de
tamanhos para manter.

### 5.9 Dependência do Android
Nada do app Android foi lido, alterado ou sincronizado. As referências de
paridade que já existiam no código (cortes de `classification.ts` e
vocabulário de `speedometerIdentity.ts`, ambos portados do Android em rodadas
anteriores) foram **preservadas como estão**. Nenhuma nova dependência foi
criada.

## 6. Decisões responsivas

- **Uma árvore só.** Nenhum componente duplicado por breakpoint; a diferença
  entre mobile e desktop é composição (`stage` vs `document`), largura
  (`contentMax`) e a grade de métricas (`grid-cols-2` → `lg:grid-cols-4`).
- **Etapas curtas centralizadas.** Formação, medição, processamento, falha e
  offline usam `align="center"`; com `<main>` agora em coluna flex, isso
  centraliza de fato na altura disponível — antes o conteúdo ficava colado no
  topo com um vazio embaixo.
- **Larguras.** Etapa e resultado rápido em 560px; resultado completo em
  720px, que é o que os quatro tiles de métrica pedem. Sem cartões laterais
  inventados para preencher a tela.
- **Mobile durante a medição.** Sem rolagem: o mostrador, a linha de estado e
  o cancelamento cabem na viewport de 390×844.
- **Áreas de toque.** Botões de ação com `min-h-[44px]`/`48px`, incluindo os
  links "Cancelar teste" e "Cancelar diagnóstico".

## 7. Estados implementados

Os nove estados de `SpeedTestVisualState`: `forming`, `quick-running`,
`quick-result`, `full-running`, `diagnosing`, `full-result`,
`restored-result`, `error`, `offline` — mais a fase `processando` do modo
Completo, que ganhou tela própria (tela 2.3).

Jornada: sem resultado restaurável, o velocímetro se forma e o teste rápido
começa sozinho; com resultado restaurável, o último resultado é restaurado e
**nenhuma** medição é disparada (provado por contagem de requisições no teste
visual). Reteste só por ação explícita. Cancelamento, erro, offline e
resultados parcial/inconclusivo/contaminado seguem os contratos existentes.

## 8. Cobertura de teste

Novos/atualizados:

- `src/lib/gaugeMath.test.ts` — geometria do mostrador (curva, varredura,
  caminho do arco, escala automática, rótulos, traços que não se sobrepõem).
- `src/lib/speedTestLayout.test.ts` — os nove estados → layout.
- `src/components/home/FullResultMetrics.test.ts` — hierarquia das métricas e
  o *fallback* de latência sob carga → jitter.
- `src/components/speedtest/DiagnosingSteps.test.tsx` — progresso derivado da
  fase real e cancelamento.
- `src/components/home/QuickResult.test.tsx`, `QuickTestJourney.test.tsx` —
  passaram a derivar `visualState`/`layout` pelas funções reais
  (`withDerivedJourneyState`), em vez de fixá-los à mão.
- `src/components/home/statusDeduplication.test.tsx` — atualizado para a nova
  composição (`UseCaseSummary` agora vive dentro de `CompleteDiagnosis`).
- `e2e/journey-accessibility.spec.ts`, `e2e/aprofundamento-retry-network.spec.ts`,
  `e2e-visual/…` — rótulo do CTA ("Fazer teste completo") e espera de
  assentamento do mostrador antes das capturas de medição.

## 9. Acessibilidade

- `<h1 className="sr-only">` da Home preservado; `<h1>` da conclusão do
  resultado completo continua único na tela.
- A narração da fase vive num único `role="status" aria-live="polite"`
  (`MeasurementStatusLine`) — o rótulo duplicado sob o mostrador foi removido.
- `DiagnosingSteps` marca cada etapa com texto (`(concluído)` /
  `(em andamento)` / `(aguardando)`), não só com cor/ícone.
- `AlertScreen` usa `<h2>` real e botões nativos; nada depende só de cor.
- `prefers-reduced-motion`: além do CSS, o mostrador lê a preferência em JS
  (`usePrefersReducedMotion`) e passa a desenhar o valor final direto.
- `underline` da Política de Privacidade e o cancelamento pendente do
  controller não foram tocados.
- Sem overflow horizontal em 320/360/390/430/600/768/1024/1280/1440.
- `journey-accessibility.spec.ts` (axe, foco, teclado) segue verde.

## 10. Comandos executados e resultados

| Comando | Resultado |
| --- | --- |
| `npm run lint` | verde (0 erros, `--max-warnings=0`) |
| `npm run typecheck` | verde (`tsc --noEmit`, sem `any`, sem cast genérico, sem `eslint-disable` novo) |
| `npm test` | **311 testes / 56 arquivos**, todos verdes (baseline da rodada: 291) |
| `npm run build` | verde — 28 rotas geradas |
| `npm run test:visual` | **18/18** (9 estados × 2 viewports) |
| `npm run test:e2e` | **24/24** |

Nenhum timeout foi aumentado, nenhum teste foi desativado e nenhuma falha foi
mascarada. A única falha real encontrada nesta rodada foi de acessibilidade —
axe `definition-list`, causada por um invólucro extra dentro do `<dl>` de
`FullResultMetrics` — e foi corrigida na estrutura, não na asserção.

## 11. Screenshots

`test-results/speed-test-flow-baseline/` — nove estados × duas viewports
(390×844 e 1440×900), gerados por `npm run test:visual`.

## 12. Diferenças restantes em relação ao protótipo

1. Sheet modal das perguntas de contexto → disclosure no fluxo (§5.2).
2. Quatro cartões de ferramenta → três (não existe rota de Ping) (§5.3).
3. `Sora` + `Plus Jakarta Sans` → família única do design system (§5.4).
4. Resultado rápido no desktop não mostra upload/ping (§5.6).
5. Placeholders de anúncio do protótipo → `ResultAdSlot` real, que só aparece
   com consentimento e configuração (regra existente da issue #21).
6. Segunda ação "Verificar conexão" na tela de falha não foi implementada:
   ela aponta para a ferramenta de Ping, que não existe neste repositório.
7. Cores do protótipo em `oklch` → tokens do design system do repositório
   (mesma família de roxo/verde/âmbar/vermelho).

## 13. Escopo

Nenhum arquivo fora de `buildea-labs/signallq-web` foi lido, alterado ou
executado. Nenhum arquivo Kotlin/Compose, nenhum módulo mobile nativo, nenhum
Worker, nenhum outro repositório. Nenhum commit, issue ou PR fora deste
repositório. O ZIP do protótipo não foi movido, renomeado nem alterado.

## 14. Commits

| SHA | Mensagem |
| --- | --- |
| `ea47b7a` | `feat(speed-test): redesenha o velocímetro conforme o protótipo` |
| `4417582` | `feat(speed-test): implementa o fluxo do protótipo em uma árvore responsiva` |
| `703d2d8` | `test(speed-test): cobre a geometria, o layout e as telas novas do fluxo` |
| _(commit deste arquivo)_ | `docs(speed-test): registra o handoff da implementação do protótipo` |

Branch `feat/prototipos-webapp-desktop`. Sem merge em `main`, sem deploy, sem
release, sem alteração de configuração de domínio, sem PR.

## 15. `git status` final

```
$ git status --short
(vazio — árvore de trabalho limpa)

$ git log --oneline -5
<este commit> docs(speed-test): registra o handoff da implementação do protótipo
703d2d8 test(speed-test): cobre a geometria, o layout e as telas novas do fluxo
4417582 feat(speed-test): implementa o fluxo do protótipo em uma árvore responsiva
ea47b7a feat(speed-test): redesenha o velocímetro conforme o protótipo
1c87666 test(e2e): isolate bandwidth-dependent scenarios
```

`docs/prototypes/` continua fora do versionamento (agora via `.gitignore`) e
o ZIP segue intacto no lugar onde estava. `test-results/` já era ignorado.
