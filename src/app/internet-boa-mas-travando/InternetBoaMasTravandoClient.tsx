"use client";
import Link from 'next/link'
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'

const SECTIONS: DocSection[] = [
  {
    title: 'Sintomas: a conta não fecha',
    text: (
      <div className="flex flex-col gap-2">
        <p>Você olha para o roteador e todas as luzes estão normais. O celular mostra o ícone de Wi-Fi no máximo. Quando você roda um teste de velocidade comum, o número que aparece na tela é alto, muitas vezes batendo o contratado com o provedor.</p>
        <p>Mas basta alguém na casa começar a baixar um arquivo, assistir a um filme em 4K ou abrir uma chamada de vídeo pesada, e tudo começa a engasgar. Mensagens demoram para ir, o jogo online fica injogável e o vídeo picota. Quando o download do outro lado termina, a sua internet &quot;volta ao normal&quot;. Se isso acontece com frequência, o problema não costuma ser a velocidade em si, mas como a rede se comporta sob estresse.</p>
      </div>
    )
  },
  {
    title: 'Causas possíveis',
    text: (
      <div className="flex flex-col gap-2">
        <p>Para entender o travamento, é preciso separar quatro coisas diferentes que chamamos genericamente de &quot;internet boa&quot;:</p>
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Velocidade (Banda):</strong> É a grossura do cano. Define o máximo de dados que podem passar por segundo. Ter muita velocidade significa que o cano é largo, mas não garante que os dados passem rápido se houver engarrafamento.</li>
          <li><strong>Sinal Wi-Fi:</strong> As barras no celular indicam apenas a força da comunicação entre o seu aparelho e o roteador dentro de casa. Um sinal forte não garante que a conexão do roteador para fora (até o resto da internet) esteja boa.</li>
          <li><strong>Estabilidade (Jitter/Perda de pacotes):</strong> É a consistência da conexão. Variações bruscas ou perda de informações no caminho causam travamentos curtos, mesmo com bastante velocidade livre.</li>
          <li><strong>Latência sob carga (Bufferbloat):</strong> Quando o limite da sua conexão é atingido (por um download rápido, por exemplo), os dados começam a formar uma fila no roteador ou no modem. Se essa fila for grande e mal gerenciada, tudo que vem depois precisa esperar muito tempo, o que dispara o atraso (ping) e causa os engasgos que você percebe na tela.</li>
        </ul>
      </div>
    )
  },
  {
    title: 'Como diferenciar o problema',
    text: (
      <div className="flex flex-col gap-2">
        <p>A melhor forma de descobrir o culpado é observando em que momento o travamento ocorre. Se a internet só trava quando você está longe do roteador ou com muitas paredes no caminho, o problema provavelmente é <strong>sinal Wi-Fi</strong> fraco ou interferência.</p>
        <p>Se ela trava de forma aleatória, de dia, de noite, com uma pessoa só usando ou com várias, o problema pode ser a <strong>estabilidade</strong> geral da rota do seu provedor ou um equipamento com defeito.</p>
        <p>Mas, se ela funciona super bem quando há apenas um dispositivo conectado, mas começa a engasgar assim que mais aparelhos dividem a rede (ou quando um único aparelho consome muita banda de uma vez), o diagnóstico mais comum é a <strong>latência sob carga</strong> (bufferbloat).</p>
      </div>
    )
  },
  {
    title: 'O que testar agora',
    text: (
      <div className="flex flex-col gap-2">
        <p>O primeiro passo é medir a sua conexão de um jeito que provoque o problema. O teste de velocidade precisa analisar a <strong>latência com e sem carga</strong>. Para isso:</p>
        <ol className="list-decimal pl-5 mt-2 flex flex-col gap-2">
          <li>Fique perto do roteador e, de preferência, pause downloads e vídeos que estejam rodando na casa.</li>
          <li>Rode um teste que meça o comportamento sob carga. Você pode fazer isso direto na nossa <Link href="/?context=travando">página inicial</Link>.</li>
          <li>Compare o número de &quot;Ping/Latência&quot; no início do teste com o número durante o download e o upload. Se o valor saltar drasticamente (ex: de poucos milissegundos para centenas de milissegundos), você está vendo o engarrafamento acontecer na prática.</li>
        </ol>
      </div>
    )
  },
  {
    title: 'Próxima ação: o que fazer',
    text: (
      <div className="flex flex-col gap-2">
        <p>Se o teste identificar latência alta sob carga (bufferbloat), aumentar o plano de internet nem sempre resolve. As soluções mais efetivas costumam ser no seu roteador:</p>
        <ul className="list-disc pl-5 mt-2 flex flex-col gap-2">
          <li><strong>Ligar o QoS (Quality of Service) ou SQM:</strong> Alguns roteadores permitem ativar uma função que organiza a fila de dados de forma inteligente, não deixando um download monopolizar a conexão e engasgar a sua chamada de vídeo.</li>
          <li><strong>Limitar banda de aparelhos específicos:</strong> Se a sua TV ou videogame estão sempre puxando o limite, você pode restringir a velocidade máxima deles.</li>
          <li><strong>Usar cabo de rede:</strong> Se o aparelho que trava muito for um PC ou videogame, conectá-lo com cabo direto no roteador tira a variação do Wi-Fi da equação.</li>
        </ul>
        <p>Para entender melhor como tudo isso é avaliado, leia nosso artigo sobre <Link href="/como-medimos">como medimos a sua conexão</Link> ou veja o <Link href="/comparativo">comparativo com outros testes</Link>.</p>
      </div>
    )
  },
  {
    title: 'Quando repetir o teste',
    text: (
      <div className="flex flex-col gap-2">
        <p>Sempre que você alterar uma configuração no roteador (como ativar o QoS), trocar o aparelho de lugar ou conectar um cabo de rede. O objetivo é ver se a diferença entre a latência inicial e a latência sob carga diminuiu.</p>
      </div>
    )
  },
  {
    title: 'Quando falar com o provedor',
    text: (
      <div className="flex flex-col gap-2">
        <p>Se mesmo no cabo de rede, sem ninguém usando a internet, a sua latência básica for muito alta e oscilar demais (o teste avisa quando a estabilidade é ruim), o problema pode estar fora da sua casa. Nesse caso, ligue para o suporte e relate a instabilidade e a perda de pacotes, e não apenas uma &quot;lentidão genérica&quot;.</p>
      </div>
    )
  },
  {
    title: 'Perguntas Frequentes (FAQ)',
    text: (
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Aumentar a velocidade do meu plano resolve o travamento?</strong>
          <p>Depende da causa. Se a internet trava porque falta banda para a quantidade de pessoas na casa, aumentar o plano ajuda. Mas se o problema for bufferbloat (fila mal gerenciada no roteador) ou sinal Wi-Fi fraco, ter um plano maior não fará o engasgo parar.</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">Por que o Wi-Fi mostra sinal cheio e mesmo assim cai?</strong>
          <p>O ícone do Wi-Fi mede apenas a força do sinal entre o celular e o roteador, não a qualidade da conexão do roteador para a internet. Você pode ter um sinal forte, mas com interferência de vizinhos ou com a conexão do provedor instável.</p>
        </div>
        <div className="flex flex-col gap-1">
          <strong className="font-semibold text-gray-900">É normal a internet ficar lenta ao fazer upload?</strong>
          <p>É comum, mas pode ser evitado. Quando enviamos arquivos pesados, o upload consome toda a banda disponível. Se o roteador não souber gerenciar a fila (bufferbloat), ele atrasará o tráfego de download também, deixando até uma simples página demorada para abrir.</p>
        </div>
      </div>
    )
  }
]

export function InternetBoaMasTravandoClient() {
  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Diagnóstico"
        title="Internet boa mas travando? Entenda os sintomas e causas"
        intro="Sinal forte e teste de velocidade alto nem sempre garantem uma internet lisa. Entenda por que a sua conexão engasga quando mais de uma pessoa usa a rede, como diferenciar problemas de velocidade e estabilidade, e o que testar para resolver."
        sections={SECTIONS}
        ctaLabel="Testar estabilidade e bufferbloat"
        ctaTo="/?context=travando"
      >
        <p className="body-medium m-0">
          Se o travamento aparece especificamente em jogos online - lag, dificuldade de jogar com amigos ou de hospedar partida - a causa
          pode ser outra: veja <Link href="/lag-em-jogos-online">lag em jogos online e o CGNAT</Link>. Para diagnósticos mais avançados na sua rede local, conheça também nosso <Link href="/app">App SignallQ</Link>.
        </p>
      </DocPage>
    </PageShell>
  )
}
