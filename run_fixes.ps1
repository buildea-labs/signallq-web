git fetch
git checkout main
git reset --hard origin/main
git checkout -b fix/issue-58-absolute-claims-final

(Get-Content src/app/app/AppLandingComponents.tsx -Encoding UTF8) -replace 'descobre por que sua internet está ruim', 'aponta causas prováveis da sua internet ruim' | Set-Content src/app/app/AppLandingComponents.tsx -Encoding UTF8

(Get-Content src/lib/pageMetaCatalog.ts -Encoding UTF8) -replace 'descobre por que sua internet está ruim', 'aponta causas prováveis da sua internet ruim' | Set-Content src/lib/pageMetaCatalog.ts -Encoding UTF8

(Get-Content src/app/comparativo/page.tsx -Encoding UTF8) -replace 'revela bufferbloat, a causa mais comum', 'ajuda a identificar bufferbloat, uma causa comum' -replace 'aponta a causa mais provável', 'aponta causas prováveis' | Set-Content src/app/comparativo/page.tsx -Encoding UTF8

(Get-Content src/app/internet-boa-mas-travando/InternetBoaMasTravandoClient.tsx -Encoding UTF8) -replace 'Isso não confirma o diagnóstico por si só', 'Isso aponta causas prováveis, mas não é a única explicação' -replace 'a fila excessiva merece investigação', 'a fila excessiva (bufferbloat) é uma hipótese que merece investigação' -replace 'o motivo normalmente não é velocidade — é latência sob carga, um efeito chamado bufferbloat', 'uma das causas possíveis não é falta de velocidade, mas sim a latência sob carga, um efeito conhecido como bufferbloat' | Set-Content src/app/internet-boa-mas-travando/InternetBoaMasTravandoClient.tsx -Encoding UTF8

@"
"use client";
import Link from 'next/link'
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'

const SECTIONS: DocSection[] = [
  {
    title: 'Por que o jogo trava se a internet parece rápida?',
    text: 'A velocidade de download importa pouco para jogos online. O que define uma partida fluida é a qualidade da comunicação: latência, jitter e perda de pacotes. Se a internet for rápida para baixar arquivos, mas a comunicação com o servidor do jogo for instável ou bloqueada, haverá lag.',
  },
  {
    title: 'Latência, Jitter e Perda de Pacotes',
    text: 'A latência (ping) é o tempo que a informação leva para ir ao servidor e voltar. O jitter é a variação dessa latência: se o ping pula de 20ms para 150ms imprevisivelmente, o jogo engasga. A perda de pacotes ocorre quando as informações não chegam ao destino, causando "teleportes".',
  },
  {
    title: 'Wi-Fi e Interferência',
    text: 'O sinal Wi-Fi sofre interferência de paredes e outros eletrônicos, causando oscilações de latência (jitter) e perda de pacotes. Para jogos, uma conexão cabeada é sempre a opção mais estável.',
  },
  {
    title: 'Congestionamento e Bufferbloat',
    text: 'Se o ping sobe quando alguém na casa assiste a um vídeo ou faz download, uma causa provável é o bufferbloat — a fila de dados no roteador que atrasa os pacotes do jogo. Roteadores que gerenciam bem o tráfego ajudam a evitar esse problema.',
  },
  {
    title: 'Rota e Servidor do Jogo',
    text: 'O problema pode estar na rota que a operadora usa até o servidor do jogo, ou no próprio servidor. Se apenas um jogo específico trava, a investigação deve focar na rota para aquele destino.',
  },
  {
    title: 'NAT Restrito e CGNAT: Hospedagem e P2P',
    text: 'Se a dificuldade for hospedar partidas ou conectar-se com amigos, o problema costuma ser NAT Restrito (Strict). Uma das causas possíveis é o CGNAT (quando a operadora compartilha um IP público). O CGNAT não causa aumento de ping sozinho, mas dificulta conexões diretas entre jogadores.',
  },
]

export function LagEmJogosOnlineClient() {
  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Diagnóstico"
        title="O que causa lag em jogos online?"
        intro="Se a internet parece boa em qualquer outro uso, mas você tem dificuldade para jogar, o problema pode estar na qualidade da comunicação (ping, jitter, perda) ou em bloqueios de portas e NAT."
        sections={SECTIONS}
        ctaLabel="Testar latência nos servidores de jogos"
        ctaTo="/jogos"
      >
        <p className="body-medium m-0">
          Se a internet trava também fora de jogos — por exemplo, engasga em chamadas de vídeo quando outra pessoa está baixando algo — veja sobre <Link href="/internet-boa-mas-travando">internet boa mas travando e o bufferbloat</Link>.
        </p>
      </DocPage>
    </PageShell>
  )
}
"@ > src/app/lag-em-jogos-online/LagEmJogosOnlineClient.tsx

(Get-Content src/lib/webDiagnosticResponse.ts -Encoding UTF8) -replace 'para confirmar se o sinal se repete', 'para verificar se o sinal se repete' | Set-Content src/lib/webDiagnosticResponse.ts -Encoding UTF8

git add .
git commit -m "fix: remove afirmações absolutas e de causalidade não comprovada (#58)"
git push -u origin fix/issue-58-absolute-claims-final
gh pr create --title "fix: corrige afirmações técnicas absolutas e causalidade não comprovada" --body "Closes #58. Remove ou suaviza afirmações que tratam hipóteses como certezas técnicas absolutas."
