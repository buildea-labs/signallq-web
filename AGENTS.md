# SignallQ Web

Este repositório contém somente o site Next.js. Leia a skill aplicável em `skills/` antes de agir.

## Agentes

- `agents/renan.md`: implementação Web.
- `agents/caio.md`: revisão independente; não implementa a entrega que revisa.

## Regras

- Não altere layout, textos, UX, rotas, escopo ou arquitetura sem instrução explícita do Luiz.
- Preserve variáveis secretas no servidor; nunca versione `.env` nem use `NEXT_PUBLIC_` para segredos.
- Toda implementação relevante requer revisão de Caio antes de merge, incluindo o gate de arquitetura em `skills/architecture-guardrails/`.
- Execute os gates definidos em `skills/quality-gates/` antes de publicar uma mudança.
- **Sempre limpe (delete) workspaces isolados ou pastas temporárias** geradas por agentes (ex: `branch` ou `share` workspaces) imediatamente após o merge da issue. Não deixe sujeira no projeto.

## Branch e PR

- **Sincronização e Conflitos**: Sempre verifique se o ambiente local e o remoto estão sincronizados (`git pull`) antes de iniciar o desenvolvimento. Verifique se existem outras branches abertas ou PRs concomitantes que possam gerar conflitos, e resolva-os quando possível e fizer sentido.
- **Não precisa de branch/PR**: atualização de documentação (`.md`, changelogs, comentários de contexto) e ajustes finos de layout (espaçamento, cor, texto de um elemento isolado — sem mudar estrutura, hierarquia ou comportamento). Commit direto na main, com mensagem descritiva.
- **Precisa de branch + PR**: qualquer mudança de código com lógica, estado, rotas, componentes novos ou alterados estruturalmente, hooks, stores, engine — e qualquer mudança de layout que altere estrutura, hierarquia ou comportamento (não apenas ajuste visual pontual).
- **Convenção de Nomenclatura**: Sempre que abrir uma branch ou PR, utilize o formato `[nome do modelo]-[numero da issue]-[nome da feature]`. (exemplo de branch: `antigravity-17-criar-login-de-acesso` / exemplo de título de PR: `antigravity-17-criar login de acesso`).
- Na dúvida entre os dois casos, tratar como mudança maior e abrir branch/PR.
- PR de código passa pelo gate de arquitetura e revisão de Caio antes de merge.
- **Fechamento**: Sempre atualize ou feche as issues relacionadas ao final da implementação, garantindo que o status no board reflita a realidade.
