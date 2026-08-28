import Image from 'next/image'
import Link from 'next/link'

export const FEATURES = [
  { icon: 'wifi', title: 'Wi-Fi cômodo a cômodo', text: 'Mede o sinal em cada ambiente da casa e mostra onde ele morre.' },
  { icon: 'signal_cellular_alt', title: 'Sinal 4G/5G real', text: 'RSRP, RSRQ e SINR direto do rádio do aparelho, não estimado.' },
  { icon: 'psychology', title: 'Diagnóstico por IA', text: 'Descreve o problema com suas palavras e recebe uma causa provável, não um número solto.' },
  { icon: 'sports_esports', title: 'Modo gamer por jogo', text: 'Escolhe o jogo e o aparelho e recebe um veredito específico para aquela partida.' },
  { icon: 'devices', title: 'Dispositivos na rede', text: 'Vê quem está conectado ao Wi-Fi, sem entrar no roteador.' },
];
export const FEATURES_LOOP = [...FEATURES, ...FEATURES];

export const STEPS = [
  { n: '1', title: 'Baixe na Play Store', text: 'Instale o SignallQ gratuitamente no seu celular Android.' },
  { n: '2', title: 'Rode o teste', text: 'Meça velocidade, Wi-Fi, sinal móvel e latência em poucos segundos.' },
  { n: '3', title: 'Veja o diagnóstico', text: 'Receba a causa provável do problema, não só um número solto.' },
  { n: '4', title: 'Aja com confiança', text: 'Saiba se o problema é do seu roteador, do provedor ou do jogo/app específico.' },
];

// Galeria de capturas reais (issue #61, curadoria de Juliana) — ordem
// narrativa: testar → diagnosticar → aprofundar sinal → caso de uso extra.
// `teste-01-home-dark.png` fica só no hero (já cobre a tela Início) e não
// repete aqui. `teste-09` usa o arquivo recortado (sem o cartão de anúncio de
// teste "Patrocinado — Google Ads"), ver `teste-09-jogos-recortado.jpg`.
export const GALLERY_ITEMS = [
  {
    src: '/assets/teste-02-medindo.jpg',
    width: 1080,
    height: 2340,
    alt: "Tela 'Medindo...' do SignallQ com velocímetro circular mostrando 201 Mbps de download em andamento, chips de fase (Latência concluída, Download ativo, Upload, Concluído) e rodapé indicando o servidor de teste.",
    caption: 'Teste em andamento, em tempo real',
  },
  {
    src: '/assets/teste-03-resultado.jpg',
    width: 1080,
    height: 2340,
    alt: "Tela de resultado do teste do SignallQ com o título 'Problema na Internet', indicando Wi-Fi bom mas problema na conexão com a internet; cards de velocidade de download (289,7 Mbps, Excelente) e upload (238,8 Mbps, Excelente), com tempo de resposta, variação, falhas estimadas e lentidão com rede ocupada.",
    caption: 'Resultado interpretado, não só o número',
  },
  {
    src: '/assets/teste-04-diagnostico-problema.jpg',
    width: 1080,
    height: 2340,
    alt: "Tela 'Vamos descobrir o que está acontecendo' do SignallQ, com lista de sintomas para selecionar: internet instável, vídeos travando, jogos atrasando, chamadas de vídeo travando, sites lentos, velocidade abaixo do plano ou problema não identificado.",
    caption: 'Diagnóstico guiado pelo seu sintoma',
  },
  {
    src: '/assets/teste-05-diagnostico-explicacao.jpg',
    width: 1080,
    height: 2340,
    alt: "Tela 'O que identifiquei' do SignallQ com conclusão de que a variação, as falhas e o upload estão dentro do esperado para chamada de vídeo, detalhamento dos dados medidos, explicação sobre interferência de canal Wi-Fi e cartão do provedor com opção de contato com a operadora.",
    caption: 'Causa provável, com explicação',
  },
  {
    src: '/assets/teste-06-sinal-wifi.jpg',
    width: 1080,
    height: 2340,
    alt: "Aba Sinal (Wi-Fi) do SignallQ mostrando a rede 'Luiz-5G' conectada, estrutura estimada de nós mesh detectados e lista de outras redes próximas.",
    caption: 'Wi-Fi cômodo a cômodo',
  },
  {
    src: '/assets/teste-07-sinal-movel.jpg',
    width: 1080,
    height: 2340,
    alt: 'Aba Sinal (Móvel) do SignallQ mostrando o Chip 1 TIM em uso, RSRP de -114 dBm em 5G NSA, qualidade de sinal classificada como Ruim e experiência esperada limitada.',
    caption: 'Sinal 4G/5G direto do rádio',
  },
  {
    src: '/assets/teste-08-sinal-canal.jpg',
    width: 1080,
    height: 2340,
    alt: 'Aba Sinal (Canal) do SignallQ, em tema escuro, com aviso de canal Wi-Fi congestionado, gráfico de intensidade por canal em 5GHz e recomendação de troca de canal.',
    caption: 'Por que o Wi-Fi está lento',
  },
  {
    src: '/assets/teste-09-jogos-recortado.jpg',
    width: 1080,
    height: 1750,
    alt: "Tela 'Resultado para o jogo' do SignallQ, em tema escuro, para Call of Duty: Warzone em PS5/PS4, com conclusão positiva sobre tempo de resposta, variação e download para battle royale, e explicação sobre a latência medida.",
    caption: 'Veredito por jogo, não Mbps genérico',
  },
];

export function AppLandingHero({
  onBaixar,
  onVerDiferenciais,
}: {
  onBaixar: () => void
  onVerDiferenciais: () => void
}) {
  return (
    <div className="relative w-full box-border flex justify-center overflow-hidden p-[28px_20px_24px] sm:p-[56px_var(--safe-x)_40px]">
      <div className="sq-app-glow-a absolute left-[8%] top-[-80px] w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%)' }} />
      <div className="sq-app-glow-b absolute right-[6%] top-[120px] w-[380px] h-[380px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-blue) 26%, transparent), transparent 70%)' }} />

      <div className="relative w-full max-w-[1080px] flex items-center gap-[48px] flex-wrap">
        <div className="flex-[1_1_420px] flex flex-col items-center sm:items-start gap-4 text-center sm:text-left">
          <h1 className="m-0 max-w-[560px] font-bold text-[30px] sm:text-[42px] leading-[1.12] text-[color:var(--text-primary)] text-pretty">
            O app que não para no número: aponta causas prováveis da sua internet ruim
          </h1>
          <p className="m-0 max-w-[480px] font-normal text-[16px] leading-[1.5] text-[color:var(--text-secondary)] text-pretty">
            Wi-Fi cômodo a cômodo, sinal 4G/5G real e diagnóstico por IA: o que a maioria dos testes de velocidade tradicionais não mostra.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-[6px]">
            <button
              type="button"
              onClick={onBaixar}
              className="h-[48px] flex items-center gap-2 px-6 rounded-full border-none bg-[color:var(--accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_40%,_transparent)] cursor-pointer hover:brightness-110 transition-all"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">download</span>
              <span className="font-semibold text-[15px] leading-[1.2] text-[color:var(--on-accent)]">Baixar na Play Store</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="sq-app-dot w-2 h-2 rounded-full bg-[color:var(--success)]" />
            <span className="font-normal text-[12px] leading-[1.3] text-[color:var(--text-tertiary)]">
              Android · gratuito para baixar
            </span>
          </div>
        </div>

        <div className="sq-app-float flex-none rounded-[30px] p-[6px] box-border bg-[#16181d] shadow-[0_18px_40px_-14px_rgba(0,0,0,.5)] mx-auto sm:mx-0">
          <Image
            src="/assets/teste-01-home-dark.png"
            alt="Tela Início do SignallQ em modo escuro, com acesso rápido ao teste de velocidade"
            width={380}
            height={854}
            className="block rounded-[22px]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onVerDiferenciais}
        aria-label="Ver diferenciais do app"
        className="sq-app-bounce absolute left-1/2 bottom-2 -translate-x-1/2 hidden sm:flex items-center justify-center rounded-full border-none bg-transparent p-1 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[24px] text-[color:var(--text-tertiary)]">expand_more</span>
      </button>
    </div>
  )
}

export const APP_DIFERENCIAIS_ID = 'app-diferenciais'

export function AppLandingFeatures() {
  return (
    <div id={APP_DIFERENCIAIS_ID} tabIndex={-1} className="sq-app-reveal flex flex-col gap-4 scroll-mt-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]">
      <div className="text-center font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
        Diferenciais
      </div>
      <div className="sq-app-scroller w-full overflow-hidden">
        <div className="sq-app-track">
          {FEATURES_LOOP.map((f, i) => (
            // i >= FEATURES.length: itens duplicados para o loop infinito do carrossel — ocultos
            // da árvore acessível para evitar conteúdo duplicado (issue #57).
            <div key={i} aria-hidden={i >= FEATURES.length || undefined} className="flex-none w-[240px] flex flex-col gap-2 rounded-[20px] p-5 box-border bg-[color:var(--bg-secondary)] shadow-[0_10px_26px_rgba(0,0,0,.16)]">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[color:var(--accent)]">{f.icon}</span>
              <div className="font-semibold text-[15px] leading-[1.3] text-[color:var(--text-primary)]">{f.title}</div>
              <div className="font-normal text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AppLandingGallery() {
  return (
    <div className="sq-app-reveal flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="m-0 font-bold text-[24px] leading-[1.3] text-[color:var(--text-primary)]">
          O app por dentro
        </h2>
        <p className="m-0 max-w-[560px] font-normal text-[13px] leading-[1.5] text-[color:var(--text-tertiary)]">
          Capturas reais do app, no tema que o próprio aparelho do usuário estiver usando.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GALLERY_ITEMS.map((item) => (
          <figure
            key={item.src}
            className="m-0 flex flex-col gap-2 rounded-[20px] p-3 box-border bg-[color:var(--bg-secondary)] shadow-[0_10px_26px_rgba(0,0,0,.16)]"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="w-full h-auto rounded-[14px]"
            />
            <figcaption className="text-center font-medium text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">
              {item.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export function AppLandingSteps() {
  return (
    <div className="sq-app-reveal flex flex-col gap-5">
      <h2 className="m-0 text-center font-bold text-[24px] leading-[1.3] text-[color:var(--text-primary)]">
        Como funciona
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[20px] p-[22px] box-border bg-[color:var(--bg-secondary)] shadow-[0_10px_26px_rgba(0,0,0,.16)]">
            <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center bg-[color:var(--accent)] font-bold text-[14px] leading-none text-[color:var(--on-accent)]">
              {s.n}
            </div>
            <div className="font-semibold text-[15px] leading-[1.3] text-[color:var(--text-primary)]">{s.title}</div>
            <div className="font-normal text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppLandingTrust() {
  return (
    <div className="sq-app-reveal flex flex-col gap-2 text-center">
      <h2 className="m-0 font-semibold text-[15px] leading-[1.3] text-[color:var(--text-secondary)]">
        Requisitos e privacidade
      </h2>
      <p className="m-0 max-w-[640px] mx-auto font-normal text-[13px] leading-[1.6] text-[color:var(--text-tertiary)] text-pretty">
        Requer aparelho Android com Play Store. Veja como tratamos os dados coletados em{' '}
        <Link href="/privacidade" className="text-[color:var(--accent)] hover:underline">Privacidade</Link>.
      </p>
    </div>
  )
}

export function AppLandingCTA({ onBaixar }: { onBaixar: () => void }) {
  return (
    <div className="sq-app-reveal relative flex flex-wrap items-center justify-between gap-5 rounded-[24px] p-[32px] box-border overflow-hidden bg-[linear-gradient(135deg,_color-mix(in_srgb,_var(--accent)_20%,_var(--bg-secondary)),_var(--bg-secondary))] shadow-[0_16px_40px_rgba(0,0,0,.2)]">
      <div className="sq-app-glow-a absolute right-[-60px] top-[-60px] w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)' }} />
      <div className="relative flex-[1_1_320px] flex flex-col gap-1">
        <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
          Disponível para Android
        </div>
        <div className="font-bold text-[20px] leading-[1.3] text-[color:var(--text-primary)]">
          Baixe agora e descubra o que está travando sua internet
        </div>
      </div>
      <div className="relative flex flex-wrap items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={onBaixar}
          className="h-[48px] flex items-center gap-2 px-6 rounded-full border-none bg-[color:var(--accent)] shadow-[0_14px_30px_color-mix(in_srgb,_var(--accent)_40%,_transparent)] shrink-0 cursor-pointer hover:brightness-110 transition-all"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[color:var(--on-accent)]">download</span>
          <span className="font-semibold text-[15px] leading-[1.2] text-[color:var(--on-accent)] whitespace-nowrap">Baixar na Play Store</span>
        </button>
      </div>
    </div>
  )
}
