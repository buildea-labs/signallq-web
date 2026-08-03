"use client";
import Link from 'next/link'
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'

const SECTIONS: DocSection[] = [
  {
    title: 'Sintomas: escolhendo o plano errado',
    text: (
      <div className="flex flex-col gap-2">
        <p>Você decide assinar um plano de 500 Mega ou 1 Giga achando que finalmente vai acabar com o lag e ter partidas perfeitas. Mas quando começa a jogar, os problemas continuam. O personagem trava, as ações demoram, e você perde combates que tinha certeza de ter ganhado.</p>
        <p>A frustração bate porque você pagou pela &quot;melhor internet&quot;, mas a sua experiência no jogo ainda está ruim. Isso acontece porque a indústria vende planos focados quase exclusivamente em velocidade, mas a velocidade é o que o jogo menos usa.</p>
      </div>
    )
  },
  {
    title: 'Causas possíveis (o que o jogo realmente precisa)',
    text: (
      <div className="flex flex-col gap-2">
        <p>Em vez de grandes tubulações, os jogos online exigem rodovias rápidas e livres de buracos. Aqui estão os fatores vitais para uma boa partida:</p>
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Banda (Velocidade):</strong> Para jogar, você precisa de muito pouco. A maioria dos jogos gasta menos de 1 Mbps. A velocidade só faz diferença na hora de baixar o jogo ou atualizações grandes.</li>
          <li><strong>Latência Básica (Ping):</strong> Quanto mais perto de zero, melhor. Se a latência ficar abaixo da faixa de 40 a 60 ms, a experiência já é muito boa para a maioria dos jogos. Acima de 100 ms, o atraso começa a incomodar. <em>Lembre-se: esses números são aproximados e variam dependendo da sensibilidade e do tipo de jogo (tiro vs turno).</em></li>
          <li><strong>Consistência (Jitter baixo):</strong> É preferível jogar com 80 ms constantes do que num ping de 20 ms que fica pulando para 150 ms aleatoriamente. O cérebro acostuma com um pequeno atraso constante, mas o jitter alto destrói os reflexos.</li>
          <li><strong>Resistência à Carga:</strong> A rede da sua casa precisa conseguir lidar com um celular puxando vídeo no quarto sem "sufocar" a conexão do videogame (bufferbloat).</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Como diferenciar o problema',
    text: (
      <div className="flex flex-col gap-2">
        <p>Se o ping for sempre alto, a culpa costuma ser da distância para o servidor ou de uma rota ruim que o provedor adotou.</p>
        <p>Se o problema for jitter (variações imprevisíveis e engasgos rápidos), a causa é frequentemente a rede local: muito provavelmente, o Wi-Fi. O Wi-Fi sofre com paredes, portas, outros eletrônicos e redes dos vizinhos.</p>
        <p>Se a internet só fica ruim à noite quando todos da casa estão em casa, a culpa pode ser de sobrecarga, seja no seu próprio roteador (bufferbloat) ou na rede local do seu provedor (saturação do nó da rua).</p>
      </div>
    )
  },
  {
    title: 'O que testar agora',
    text: (
      <div className="flex flex-col gap-2">
        <ol className="list-decimal pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Faça um teste de latência dedicado:</strong> Acesse a página <Link href="/jogos">latência para jogos</Link> e confira como está a comunicação com as redes de Steam, Riot Games e Xbox Live no seu aparelho.</li>
          <li><strong>Teste os efeitos da carga:</strong> Rode o teste completo na <Link href="/?context=jogos">nossa página inicial</Link> e veja como a latência do teste aumenta durante as fases de download e upload. Um aumento grande (ex: saltando para mais de 100ms) indica que outros aparelhos na sua casa vão atrapalhar as suas partidas.</li>
        </ol>
      </div>
    )
  },
  {
    title: 'Próxima ação: o que fazer',
    text: (
      <div className="flex flex-col gap-2">
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Ligue um cabo de rede:</strong> Sério. Se você joga competitivo no PC ou videogame, a melhor e mais barata ação que você pode fazer é usar um cabo de rede até o roteador, eliminando instabilidades do Wi-Fi.</li>
          <li><strong>Não assine um plano maior só pelo jogo:</strong> Aumentar de 300 para 600 Mbps não vai diminuir seu ping nem sumir com o lag, a não ser que falte banda na sua casa o tempo todo.</li>
          <li><strong>Considere a rota:</strong> Em alguns casos extremos, provedores menores podem usar rotas muito longas. Uma VPN voltada para jogos (como ExitLag ou NoPing) pode ajudar a encontrar uma rota mais curta, mas elas não curam um sinal de Wi-Fi ruim ou bufferbloat.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Quando repetir o teste',
    text: (
      <div className="flex flex-col gap-2">
        <p>Teste novamente quando alterar a conexão de Wi-Fi para cabo ou ao ligar opções como QoS (Quality of Service) no roteador para melhorar o desempenho contra carga. (Entenda <Link href="/como-medimos">como nossos testes funcionam</Link>).</p>
      </div>
    )
  },
  {
    title: 'Quando falar com o provedor',
    text: (
      <div className="flex flex-col gap-2">
        <p>Se, testando via cabo e sem ninguém usando a rede em casa, o seu ping com servidores que ficam no Brasil (como no teste de jogos) for sistematicamente alto, ou se houver perda de pacotes crônica apontada pelo nosso teste.</p>
        <p>Informe o provedor que a instabilidade ou alta latência persiste mesmo via cabo. (Para investigar dificuldades de hospedar partidas, veja o problema do <Link href="/lag-em-jogos-online">CGNAT</Link>).</p>
      </div>
    )
  },
  {
    title: 'Perguntas Frequentes (FAQ)',
    text: (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Quantos Mega preciso para jogar no PS5 / PC / Xbox?</strong>
          <p>Para jogar online, até um plano básico de 10 Mega (livres) é mais que suficiente. O problema é que, hoje, dividimos a casa com TVs e celulares passando vídeos em alta resolução. Planos a partir de 100-200 Mbps costumam garantir folga de sobra para as famílias.</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">A fibra ótica não garante ping zero?</strong>
          <p>Não existe ping zero. A luz precisa viajar pelos cabos e os equipamentos precisam processar a informação. A fibra ótica ajuda muito a baixar a latência quando comparada ao cabo de cobre, mas a distância entre sua cidade e o servidor da empresa de games é o limite físico da tecnologia.</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Como descubro onde fica o servidor do meu jogo?</strong>
          <p>A maioria dos jogos no Brasil hospeda seus servidores em São Paulo. Quem mora fora do estado de São Paulo tem latências naturalmente maiores. Se o servidor do jogo for no exterior, o ping não será menor que 110-150 ms devido à distância geográfica para os EUA ou Europa.</p>
        </div>
      </div>
    )
  }
]

export function InternetParaJogosClient() {
  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Guia"
        title="Que internet você precisa para jogar online sem travar"
        intro="Não é só velocidade: latência baixa e estável importa mais que Mbps para a maioria dos jogos competitivos. Entenda o que faz diferença de verdade para melhorar seu ping e curar engasgos."
        sections={SECTIONS}
        ctaLabel="Testar latência nos servidores de jogos"
        ctaTo="/jogos"
      >
        <p className="body-medium m-0">
          Se as suas partidas costumam falhar quando outras pessoas estão puxando a internet ao mesmo tempo, veja a explicação completa sobre <Link href="/internet-boa-mas-travando">bufferbloat</Link>. Para diagnósticos aprofundados baseados no seu tipo de conexão, use o nosso <Link href="/app">App SignallQ</Link>.
        </p>
      </DocPage>
    </PageShell>
  )
}
