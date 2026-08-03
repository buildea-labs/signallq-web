"use client";
import Link from 'next/link'
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'

const SECTIONS: DocSection[] = [
  {
    title: 'Sintomas: internet rápida, jogo travando',
    text: (
      <div className="flex flex-col gap-2">
        <p>A navegação web é rápida e os vídeos carregam bem, mas na hora de jogar, o personagem &quot;teleporta&quot;, os tiros demoram a registrar (delay), ou você cai da partida do nada. Às vezes, o jogo flui bem, mas você não consegue entrar na sala dos seus amigos nem hospedar um servidor.</p>
        <p>Jogos online usam muito pouca velocidade (banda) - a maioria gasta menos de 1 Mbps. O que importa para o jogo não é a quantidade de dados por segundo, mas sim a <strong>rapidez e consistência</strong> com que as informações vão da sua casa até o servidor e voltam. Se a comunicação engasga, o lag aparece.</p>
      </div>
    )
  },
  {
    title: 'Causas possíveis (e como entender a sopa de letrinhas)',
    text: (
      <div className="flex flex-col gap-2">
        <p>Várias coisas influenciam a conexão no momento de jogar. Aqui estão os principais suspeitos:</p>
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Ping (Latência):</strong> É o tempo de resposta, medido em milissegundos (ms). Um ping de 20ms é ótimo; um ping de 150ms causa atraso perceptível nas ações. A distância até o servidor dita o limite mínimo do ping.</li>
          <li><strong>Jitter (Variação do Ping):</strong> É a oscilação. Um ping alto mas cravado (ex: sempre 80ms) é melhor do que um ping que pula de 20ms para 150ms o tempo todo. Essa oscilação cria &quot;engasgos&quot; imprevisíveis.</li>
          <li><strong>Perda de Pacotes:</strong> Quando algumas informações enviadas se perdem pelo caminho. É o que causa o famoso &quot;teleporte&quot; de personagens ou tiros que não registram.</li>
          <li><strong>Cabo de rede vs Wi-Fi:</strong> O Wi-Fi é excelente para celular e vídeos, mas sofre pequenas interferências invisíveis (paredes, redes vizinhas). O cabo de rede oferece consistência, essencial contra o jitter.</li>
          <li><strong>Rede ocupada (Bufferbloat):</strong> Acontece quando outra pessoa na casa (ou um celular baixando atualização) congestiona o roteador, atrasando os pacotes do seu jogo.</li>
          <li><strong>Distância e Rota:</strong> Às vezes o seu provedor não tem um &quot;caminho&quot; curto até o servidor do jogo, ou um cabo submarino está com problemas. A velocidade é boa, mas o caminho (a rota) está congestionado ou é longo demais.</li>
          <li><strong>O Servidor do Jogo:</strong> Se todo mundo na partida está reclamando de lag, o problema é a infraestrutura da desenvolvedora do jogo, não a sua internet.</li>
          <li><strong>NAT Restrito e CGNAT:</strong> Afetam principalmente a conexão com outras pessoas. Se o seu NAT é &quot;Restrito&quot;, você não consegue hospedar partidas em alguns jogos. O CGNAT ocorre quando o provedor divide um mesmo IP público entre vários clientes, o que pode bloquear conexões diretas (P2P), muito usadas em jogos de console.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Como diferenciar o problema',
    text: (
      <div className="flex flex-col gap-2">
        <p>Para descobrir de onde vem o lag, observe o comportamento:</p>
        <p>Se o ping só sobe quando alguém assiste filme ou faz download, a causa mais provável é a <strong>rede ocupada (Bufferbloat)</strong>. Se o lag acontece toda hora e você joga no Wi-Fi, o suspeito número um é a <strong>interferência no Wi-Fi</strong>.</p>
        <p>Se o problema só acontece em um jogo específico (enquanto os outros rodam lisos), o problema pode ser a <strong>rota do provedor ou o servidor do jogo</strong>. Já se o problema não for &quot;lag&quot;, mas sim não conseguir se conectar à voz do jogo ou entrar na sala do amigo, você deve investigar o <strong>NAT Restrito ou CGNAT</strong>.</p>
      </div>
    )
  },
  {
    title: 'O que testar agora',
    text: (
      <div className="flex flex-col gap-2">
        <ol className="list-decimal pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Isole o Wi-Fi:</strong> Conecte seu PC ou videogame direto no roteador com um cabo de rede. Se o lag parar, a culpa era da rede sem fio.</li>
          <li><strong>Teste a rota do jogo:</strong> Use a nossa ferramenta de <Link href="/jogos">latência até servidores de jogos</Link> para checar o ping do seu provedor até as redes da Riot, Steam ou Xbox Live.</li>
          <li><strong>Teste sob carga:</strong> Faça um teste na nossa <Link href="/?context=jogos">página principal</Link> prestando atenção na métrica de &quot;estabilidade&quot;. Se durante o teste a latência explodir, sua rede sofre com bufferbloat e engasgará sempre que alguém usar a internet junto com você.</li>
        </ol>
      </div>
    )
  },
  {
    title: 'Próxima ação: o que fazer',
    text: (
      <div className="flex flex-col gap-2">
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Se o problema for no Wi-Fi:</strong> Mude para o cabo de rede. Se não der, tente jogar mais perto do roteador ou na rede 5GHz (que tem menos interferência que a 2.4GHz, mas alcance menor).</li>
          <li><strong>Se o problema for bufferbloat:</strong> Configure o QoS no seu roteador (para priorizar o jogo) ou restrinja os downloads durante as partidas. Aumentar o plano às vezes ajuda, se o plano antigo for muito básico.</li>
          <li><strong>Se for NAT Restrito/CGNAT:</strong> Você pode precisar ativar o UPnP no roteador ou pedir para o provedor um IP público / sair do CGNAT (às vezes cobram a mais por isso).</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Quando repetir o teste',
    text: (
      <div className="flex flex-col gap-2">
        <p>Sempre que puxar um cabo novo, mudar configurações do roteador ou alterar o plano com o provedor. Use a <Link href="/jogos">nossa ferramenta de teste de jogos</Link> como referência neutra para confirmar se a latência real melhorou.</p>
      </div>
    )
  },
  {
    title: 'Quando falar com o provedor',
    text: (
      <div className="flex flex-col gap-2">
        <p>Se você joga no cabo de rede, ninguém está usando a internet na hora, e a ferramenta acusa alta perda de pacotes ou ping elevado para servidores no Brasil. Relate o problema mencionando o &quot;jogo&quot; e peça uma revisão de rota.</p>
        <p>Se o teste apontar que você não consegue hospedar e confirmar o CGNAT, você pode solicitar a saída dele (dependendo do contrato) para conseguir &quot;NAT Aberto&quot;.</p>
      </div>
    )
  },
  {
    title: 'Perguntas Frequentes (FAQ)',
    text: (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Mudar o DNS abaixa meu ping?</strong>
          <p>O DNS não resolve problemas de rota durante o jogo, ele apenas traduz o nome do site para um IP. Ele pode fazer o jogo conectar mais rápido inicialmente, mas não reduz o ping durante a partida. (Veja como medimos e comparamos DNS no nosso <Link href="/dns">teste de DNS</Link>).</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Aumentar minha velocidade resolve o lag?</strong>
          <p>Raramente. Os jogos consomem pouquíssima banda. Ter um plano de 100 Mega ou 1000 Mega não fará a informação viajar mais rápido até o servidor do jogo, a não ser que a sua rede esteja frequentemente congestionada por downloads grandes simultâneos.</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Como sei se o lag é culpa do meu equipamento?</strong>
          <p>O teste mais simples é conectar via cabo de rede. Se a perda de pacotes e os picos de jitter sumirem, o equipamento Wi-Fi era o culpado. Para um diagnóstico de equipamento mais aprofundado, baixe o nosso <Link href="/app">App</Link>.</p>
        </div>
      </div>
    )
  }
]

export function LagEmJogosOnlineClient() {
  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Diagnóstico"
        title="Lag em jogos online com boa internet? Pode ser CGNAT ou Rota"
        intro="Se a internet é rápida para vídeos e downloads, mas sofre com atrasos, engasgos e problemas de conexão em partidas online, o problema está na estabilidade da comunicação (ping, jitter, perda de pacotes) ou bloqueios na rede (NAT restrito)."
        sections={SECTIONS}
        ctaLabel="Testar latência nos servidores de jogos"
        ctaTo="/jogos"
      >
        <p className="body-medium m-0">
          Se a internet trava também fora de jogos - por exemplo, engasga em chamadas de vídeo quando outra pessoa está baixando algo - veja sobre <Link href="/internet-boa-mas-travando">internet boa mas travando e o bufferbloat</Link>.
        </p>
      </DocPage>
    </PageShell>
  )
}
