# Auditoria PWA, SEO e monetização

Data da auditoria: 1º de agosto de 2026. Esta evidência cobre a parcela
versionável da issue #21; as validações que dependem da publicação em
`https://signallq.com` só podem ser concluídas depois da ativação do domínio
da issue #20.

## Identidade e instalação

- O `manifest.json` declara nome, nome curto, idioma, `start_url`, `scope`,
  modo standalone e ícones `192`, `512` e maskable.
- O manifest, favicon e Apple Touch Icon apontam diretamente para o asset
  oficial da marca Q em `public/assets/signallq-icon-512-play-store.png`.
  O arquivo-fonte tem 1024×1024 px, excedendo os tamanhos mínimos de 192×192 e
  512×512 exigidos pelos instaladores. O mesmo asset tem margem segura para o
  uso maskable; não há derivação ou redesenho da marca.
- `theme_color` e o viewport usam o fundo escuro oficial `#131217`.
- O Service Worker só ativa uma atualização após confirmação explícita da
  pessoa usuária; os ícones fazem parte do precache com hash da build, evitando
  que uma versão nova mantenha os assets antigos indefinidamente.
- A instalação usa o prompt nativo quando disponível e oferece orientação
  específica para iOS. Nenhum teste ou diagnóstico é simulado offline.

## SEO técnico

- `metadataBase`, canonicals, Open Graph, Twitter Cards, compartilhamento,
  `robots.txt` e `sitemap.xml` usam a origem canônica
  `https://signallq.com`.
- O redirecionamento permanente de `www.signallq.com` para o host canônico
  preserva caminho e query string. A publicação/validação desse
  redirecionamento permanece dependente da Vercel e do DNS.
- As rotas de histórico local declaram `noindex`; as demais rotas públicas
  usam a Metadata API com conteúdo correspondente.

## Publicidade e privacidade

- `ads.txt` é servido estaticamente e o script AdSense só é carregado quando
  há publisher ID público configurado e consentimento explícito.
- Recusar o consentimento impede o carregamento do script. A decisão é
  persistida localmente e a política explica como removê-la.
- Não há componente que crie slots, anúncios automáticos ou anúncios durante
  a medição, no diagnóstico, nos botões de ação ou em estados de erro.

## Validação pendente de publicação

1. Concluir a configuração DNS/TLS/redirects da issue #20 na Vercel, Hostinger
   e Cloudflare Pages.
2. Executar um deploy manual de produção e validar no domínio oficial:
   manifest, instalação, atualização, favicon, `ads.txt`, sitemap, robots e
   canonical por rota.
3. Inserir o token real de verificação no Search Console exclusivamente pela
   configuração apropriada e enviar o sitemap após a publicação. Nenhum token
   é versionado neste repositório.
4. Caso a marca oficial seja substituída, fornecer os arquivos finais em
   tamanhos adequados; não gerar ou reinterpretar uma marca nova a partir de
   imagens existentes.
