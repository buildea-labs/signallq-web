"use client";
import Link from 'next/link'
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { PAGE_META } from '../../lib/pageMetaCatalog'

// Conteúdo de SEO long-tail (issue #1399, consultoria de marketing registrada em #1374).
// Tema fora da lista original de 11 termos, sem grande portal dominando ainda --
// encaixa direto no posicionamento do SignallQ de explicar a causa, não só medir.
// Cada seção segue "resposta primeiro": a(s) primeira(s) frase(s) já respondem a
// pergunta do título, o resto elabora o mecanismo. Copy preservado 1:1 na
// reconstrução v2 (README, "só a moldura visual muda") — só a composição
// (SiteNav/SiteFooter, via DocPage/PageShell) mudou.
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

export default function Page() {
  useDocumentMeta(PAGE_META['/lag-em-jogos-online'])

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
