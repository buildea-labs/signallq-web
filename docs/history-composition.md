# Composição do Histórico

Decomposição de `src/app/historico/page.tsx` (era 251 linhas, com carregamento, filtro,
exportação, exclusão, agrupamento, comparações e formulário de edição no mesmo arquivo) executada
na issue #90, item 13 do plano de auditoria 2026-08 e regras de `skills/architecture-guardrails/`.

## Árvore

```
src/app/historico/page.tsx              (89 linhas — composição + metadata)
 ├─ HistoryLoadingState                 estado de carregamento
 ├─ HistoryUnavailableState             falha de leitura do armazenamento local + "Tentar novamente"
 ├─ HistoryEmptyState                   sem medições + "Testar velocidade"
 ├─ HistoryDiagnosticTip                dica fixa de diagnóstico
 ├─ HistoryToolbar                      filtros (FILTROS), limpar histórico, exportar dados
 ├─ HistoryEvolutionChart               (já existia) gráfico de evolução
 ├─ HistoryCompare                      retestes vinculados (comparações recuperáveis)
 ├─ HistoryList                         grupos + "Nenhuma medição neste filtro" + total salvo
 │   └─ HistoryListItem                 uma conexão/local: nome, contagem, padrão local e cards
 │       └─ HistoryRecordCard           (já existia) card por medição
 ├─ ConfirmDialog                       (já existia) confirmação de limpar tudo
 └─ HistoryEditDialog                   modal de contexto da conexão (editar/excluir conexão)
```

Os três estados de tela (carregando/indisponível/vazio) ficam no mesmo arquivo
`HistoryEmptyState.tsx` porque compartilham a mesma regra de layout: o título da página é fixo no
topo (Guia §7.2) e só o bloco de estado centraliza no espaço restante.

`HistoryDetail`, previsto na lista do item 13 do plano, **não foi criado**: a tela de Histórico
não tem uma visão de detalhe hoje: o que existe de "detalhe" é o resumo do padrão local, que vive
dentro de `HistoryListItem`. Criar o componente exigiria inventar UI, o que `AGENTS.md` proíbe sem
instrução explícita.

## Estado

Todo o estado e os handlers vivem em `src/hooks/useHistoryController.ts`: carregamento, filtro,
exportação, exclusão (registro, conexão e tudo), agrupamento por conexão, comparações recuperáveis,
edição de metadados, foco/Escape do modal e navegação para o teste. Nenhum componente da tela
acessa IndexedDB diretamente — todos consomem o hook.

`historyStore.ts` foi consumido como está; sua divisão é o item 14 do mesmo plano.

## Regra permanente

Funcionalidade nova no Histórico entra em um componente/hook existente ou em um novo — nunca de
volta em `page.tsx`, que só compõe e declara metadata.
