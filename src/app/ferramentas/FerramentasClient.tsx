'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Banda } from '@/components/Banda'
import { listRecords, type MedicaoRegistro } from '@/lib/measurementRepository'

const PROBLEMAS = [
  {
    eyebrow: 'Internet lenta',
    title: 'Minha conexão parece mais lenta do que deveria',
    description: 'Meça download, upload e latência para saber se o problema começa na velocidade entregue.',
    href: '/teste-de-velocidade',
    icon: 'speed',
    action: 'Testar velocidade',
  },
  {
    eyebrow: 'Jogos travando',
    title: 'Tenho lag mesmo com velocidade boa',
    description: 'Olhe para latência, jitter e a resposta da conexão até serviços usados por jogos.',
    href: '/jogos',
    icon: 'sports_esports',
    action: 'Investigar jogos',
  },
  {
    eyebrow: 'Sites demorando',
    title: 'Alguns sites demoram para começar a abrir',
    description: 'Compare resolvedores DNS e veja se a demora pode estar antes mesmo do carregamento do site.',
    href: '/dns',
    icon: 'dns',
    action: 'Comparar DNS',
  },
  {
    eyebrow: 'Entender a rede',
    title: 'Quero saber mais sobre a conexão que estou usando',
    description: 'Veja seu IP público, IPv4, IPv6 e sinais que ajudam a entender como você chega à internet.',
    href: '/meu-ip',
    icon: 'language',
    action: 'Ver minha conexão',
  },
] as const

const FERRAMENTAS = [
  {
    title: 'Ping',
    description: 'Meça latência e jitter para entender o tempo de resposta da sua conexão.',
    href: '/ping',
    icon: 'radio_button_checked',
    action: 'Medir ping',
  },
  {
    title: 'DNS',
    description: 'Compare Cloudflare e Google para descobrir qual resolvedor responde melhor na sua rede.',
    href: '/dns',
    icon: 'dns',
    action: 'Comparar DNS',
  },
  {
    title: 'Meu IP',
    description: 'Consulte seu endereço público e entenda melhor IPv4, IPv6 e CGNAT.',
    href: '/meu-ip',
    icon: 'language',
    action: 'Ver meu IP',
  },
  {
    title: 'Jogos',
    description: 'Meça a resposta até infraestrutura pública usada por Steam, Riot Games e Xbox Live.',
    href: '/jogos',
    icon: 'sports_esports',
    action: 'Testar jogos',
  },
] as const

const LEITURAS = [
  {
    title: 'Internet boa, mas travando?',
    description: 'Entenda por que uma conexão rápida pode piorar quando várias coisas usam a rede ao mesmo tempo.',
    href: '/internet-boa-mas-travando',
  },
  {
    title: 'Lag em jogos com internet rápida?',
    description: 'Velocidade não explica tudo. CGNAT, NAT e latência podem mudar bastante a experiência.',
    href: '/lag-em-jogos-online',
  },
  {
    title: 'Que internet eu preciso para jogar?',
    description: 'Veja por que estabilidade e latência costumam importar mais do que perseguir o maior número de Mbps.',
    href: '/internet-para-jogos',
  },
] as const

function Icone({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size }} aria-hidden="true">
      {name}
    </span>
  )
}

function NetworkVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[300px] overflow-hidden rounded-[28px] border p-6 sm:min-h-[340px]"
      style={{
        borderColor: 'color-mix(in srgb, var(--border) 45%, transparent)',
        background:
          'radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 34%), radial-gradient(circle at 20% 82%, color-mix(in srgb, var(--success) 12%, transparent), transparent 30%), var(--bg-card)',
        boxShadow: 'var(--depth-level2-shadow)',
      }}
    >
      <div className="absolute left-[18%] top-[22%] h-px w-[55%] rotate-[12deg]" style={{ background: 'color-mix(in srgb, var(--accent) 42%, transparent)' }} />
      <div className="absolute left-[25%] top-[54%] h-px w-[48%] -rotate-[17deg]" style={{ background: 'color-mix(in srgb, var(--accent) 28%, transparent)' }} />
      <div className="absolute left-[45%] top-[31%] h-[48%] w-px rotate-[8deg]" style={{ background: 'color-mix(in srgb, var(--accent) 26%, transparent)' }} />

      <div className="absolute left-[10%] top-[15%] flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--accent)', color: 'var(--on-accent)', boxShadow: 'var(--depth-level3-shadow)' }}>
        <Icone name="router" size={30} />
      </div>
      <div className="absolute right-[12%] top-[18%] flex h-14 w-14 items-center justify-center rounded-full border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--accent)' }}>
        <Icone name="language" size={26} />
      </div>
      <div className="absolute left-[42%] top-[41%] flex h-20 w-20 items-center justify-center rounded-[24px] border" style={{ background: 'var(--bg-card)', borderColor: 'color-mix(in srgb, var(--accent) 55%, var(--border))', color: 'var(--accent)', boxShadow: 'var(--depth-level2-shadow)' }}>
        <Icone name="network_check" size={34} />
      </div>
      <div className="absolute bottom-[13%] left-[13%] flex h-12 w-12 items-center justify-center rounded-full border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <Icone name="computer" size={22} />
      </div>
      <div className="absolute bottom-[15%] right-[17%] flex h-12 w-12 items-center justify-center rounded-full border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        <Icone name="smartphone" size={22} />
      </div>

      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 backdrop-blur" style={{ background: 'color-mix(in srgb, var(--bg-card) 86%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 35%, transparent)' }}>
        <div>
          <div className="label-overline text-[color:var(--text-tertiary)]">Diagnóstico</div>
          <div className="title-medium">Números viram pistas.</div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--success) 16%, transparent)', color: 'var(--success)' }}>
          <Icone name="check_circle" size={23} />
        </span>
      </div>
    </div>
  )
}

function formatMetric(value: number, unit: string) {
  const display = Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')
  return `${display} ${unit}`
}

function formatMeasurementDate(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function FerramentasClient() {
  const [latestMeasurement, setLatestMeasurement] = useState<MedicaoRegistro | null>(null)

  useEffect(() => {
    let active = true
    listRecords()
      .then((records) => {
        if (active) setLatestMeasurement(records[0] ?? null)
      })
      .catch(() => {
        if (active) setLatestMeasurement(null)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex w-full flex-col">
      <Banda className="py-14 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col items-start gap-6">
            <span className="label-overline" style={{ color: 'var(--accent)' }}>
              Ferramentas SignallQ
            </span>
            <div className="flex max-w-[720px] flex-col gap-5">
              <h1 className="m-0 text-[40px] font-bold leading-[1.03] tracking-[-1.4px] text-[color:var(--text-primary)] sm:text-[52px] lg:text-[60px]">
                Entenda o que está acontecendo com a sua internet.
              </h1>
              <p className="body-large m-0 max-w-[650px] text-[color:var(--text-secondary)] sm:text-[19px]">
                Teste velocidade, latência, DNS e sua conexão com serviços online. O SignallQ ajuda a transformar métricas técnicas em pistas que fazem sentido.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/teste-de-velocidade"
                className="label-large flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 no-underline"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                <Icone name="speed" size={20} />
                Testar minha conexão
              </Link>
              <a
                href="#explorar"
                className="label-large flex h-12 items-center justify-center rounded-[var(--radius-pill)] border px-6 no-underline"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                Explorar ferramentas
              </a>
            </div>
          </div>
          <NetworkVisual />
        </div>
      </Banda>

      <Banda tint="secondary" className="py-14 lg:py-16">
        <div className="flex flex-col gap-8">
          <div className="max-w-[720px]">
            <span className="label-overline text-[color:var(--text-tertiary)]">Por onde começar</span>
            <h2 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.4px] text-[color:var(--text-primary)] sm:text-[36px]">
              Comece pelo que você está percebendo.
            </h2>
            <p className="body-large mt-3 text-[color:var(--text-secondary)]">
              Você não precisa saber o nome técnico do problema. Escolha o sintoma e vá direto para a investigação mais útil.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PROBLEMAS.map((item) => (
              <Link
                key={item.href + item.title}
                href={item.href}
                className="group flex min-h-[190px] flex-col justify-between gap-6 rounded-[20px] border p-6 no-underline transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)', boxShadow: 'var(--depth-level1-shadow)' }}
              >
                <div className="flex items-start justify-between gap-5">
                  <div className="flex flex-col gap-2">
                    <span className="label-overline" style={{ color: 'var(--accent)' }}>{item.eyebrow}</span>
                    <h3 className="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.2px] text-[color:var(--text-primary)]">{item.title}</h3>
                    <p className="body-medium m-0 text-[color:var(--text-secondary)]">{item.description}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                    <Icone name={item.icon} size={23} />
                  </span>
                </div>
                <span className="label-large flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  {item.action} <Icone name="arrow_forward" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Banda>

      <Banda className="py-14 lg:py-20">
        <section className="grid gap-8 overflow-hidden rounded-[28px] border p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10" style={{ background: 'var(--bg-card)', borderColor: 'color-mix(in srgb, var(--accent) 42%, var(--border))', boxShadow: 'var(--depth-level2-shadow)' }}>
          <div className="flex flex-col items-start justify-center gap-5">
            <span className="label-overline" style={{ color: 'var(--accent)' }}>Teste sua conexão</span>
            <h2 className="m-0 max-w-[640px] text-[32px] font-bold leading-[1.08] tracking-[-0.6px] text-[color:var(--text-primary)] sm:text-[40px]">
              Uma medição completa é o melhor ponto de partida.
            </h2>
            <p className="body-large m-0 max-w-[620px] text-[color:var(--text-secondary)]">
              Velocidade conta só uma parte da história. O teste também observa latência e resposta sob carga para ajudar a separar falta de banda de problemas de estabilidade.
            </p>
            <Link href="/teste-de-velocidade" className="label-large mt-1 flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 no-underline" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
              Começar teste
              <Icone name="arrow_forward" size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 self-stretch">
            {[
              ['download', 'Download', 'Quanto chega até você'],
              ['upload', 'Upload', 'Quanto você consegue enviar'],
              ['network_ping', 'Latência', 'Quanto a rede demora para responder'],
              ['monitor_heart', 'Sob carga', 'Como ela reage enquanto trabalha'],
            ].map(([icon, title, copy]) => (
              <div key={title} className="flex min-h-[132px] flex-col justify-between rounded-2xl p-4" style={{ background: 'var(--bg-secondary)' }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                  <Icone name={icon} size={21} />
                </span>
                <div>
                  <div className="title-medium">{title}</div>
                  <div className="body-small mt-1 text-[color:var(--text-secondary)]">{copy}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Banda>

      <Banda tint="secondary" className="py-14 lg:py-18">
        <section id="explorar" className="scroll-mt-24">
          <div className="mb-8 max-w-[700px]">
            <span className="label-overline text-[color:var(--text-tertiary)]">Investigue mais a fundo</span>
            <h2 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.4px] text-[color:var(--text-primary)] sm:text-[36px]">
              Ferramentas específicas, sem virar um painel de laboratório.
            </h2>
            <p className="body-large mt-3 text-[color:var(--text-secondary)]">
              Use uma delas quando você já sabe qual parte da conexão quer observar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FERRAMENTAS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex min-h-[230px] flex-col justify-between rounded-[20px] border p-5 no-underline transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--bg-card)', borderColor: 'color-mix(in srgb, var(--border) 55%, transparent)' }}
              >
                <div>
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                    <Icone name={tool.icon} size={24} />
                  </span>
                  <h3 className="title-large m-0">{tool.title}</h3>
                  <p className="body-medium mt-2 text-[color:var(--text-secondary)]">{tool.description}</p>
                </div>
                <span className="label-large flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  {tool.action} <Icone name="arrow_forward" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Banda>

      <Banda className="py-14 lg:py-18">
        <section className="grid gap-7 rounded-[24px] border p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center" style={{ borderColor: 'color-mix(in srgb, var(--border) 55%, transparent)', background: 'var(--bg-card)' }}>
          <div>
            <span className="label-overline text-[color:var(--text-tertiary)]">Ao longo do tempo</span>
            <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.3px] text-[color:var(--text-primary)] sm:text-[34px]">
              Uma medição isolada é uma foto. O histórico mostra o filme.
            </h2>
            <p className="body-medium mt-3 text-[color:var(--text-secondary)]">
              Compare resultados salvos neste dispositivo e veja se a experiência mudou de verdade.
            </p>
          </div>

          {latestMeasurement ? (
            <div className="rounded-[20px] p-5 sm:p-6" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="label-overline text-[color:var(--text-tertiary)]">Sua última medição</span>
                  <div className="body-medium mt-1 text-[color:var(--text-secondary)]">{formatMeasurementDate(latestMeasurement.timestamp)}</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                  <Icone name="history" size={21} />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['Download', formatMetric(latestMeasurement.download, 'Mbps')],
                  ['Upload', formatMetric(latestMeasurement.upload, 'Mbps')],
                  ['Ping', formatMetric(latestMeasurement.latency, 'ms')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="body-small text-[color:var(--text-tertiary)]">{label}</div>
                    <div className="title-medium mt-1">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/historico/${latestMeasurement.id}`} className="label-large flex h-10 items-center justify-center rounded-[var(--radius-pill)] px-4 no-underline" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                  Ver resultado
                </Link>
                <Link href="/historico" className="label-large flex h-10 items-center justify-center rounded-[var(--radius-pill)] border px-4 no-underline" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  Ver histórico
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] p-6" style={{ background: 'var(--bg-secondary)' }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                <Icone name="history" size={23} />
              </span>
              <h3 className="title-large mb-0 mt-5">Seu histórico começa no primeiro teste.</h3>
              <p className="body-medium mt-2 text-[color:var(--text-secondary)]">As medições ficam salvas somente neste navegador.</p>
              <Link href="/teste-de-velocidade" className="label-large mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-pill)] px-4 no-underline" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                Fazer primeira medição
              </Link>
            </div>
          )}
        </section>
      </Banda>

      <Banda tint="secondary" className="py-14 lg:py-18">
        <section>
          <div className="mb-7 max-w-[700px]">
            <span className="label-overline text-[color:var(--text-tertiary)]">Entenda o resultado</span>
            <h2 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.4px] text-[color:var(--text-primary)] sm:text-[36px]">
              Quando o número sozinho não explica o problema.
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--border) 30%, transparent)' }}>
            {LEITURAS.map((item) => (
              <Link key={item.href} href={item.href} className="group grid gap-3 py-5 no-underline sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
                <div>
                  <h3 className="title-medium m-0 text-[color:var(--text-primary)]">{item.title}</h3>
                  <p className="body-medium mb-0 mt-1 text-[color:var(--text-secondary)]">{item.description}</p>
                </div>
                <span className="label-large flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                  Ler explicação <Icone name="arrow_forward" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Banda>

      <Banda className="py-14 lg:py-20">
        <section className="flex flex-col gap-6 rounded-[28px] p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:gap-12" style={{ background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-card))', border: '1px solid color-mix(in srgb, var(--accent) 32%, var(--border))' }}>
          <div className="max-w-[760px]">
            <span className="label-overline" style={{ color: 'var(--accent)' }}>E se a conexão não combinar com o seu uso?</span>
            <h2 className="mb-0 mt-2 text-[30px] font-bold leading-tight tracking-[-0.4px] text-[color:var(--text-primary)] sm:text-[36px]">
              Descubra qual faixa de internet faz sentido para a sua casa.
            </h2>
            <p className="body-large mb-0 mt-3 text-[color:var(--text-secondary)]">
              O SignallQ cruza seu perfil de uso com as ofertas disponíveis na sua região para evitar tanto falta de banda quanto velocidade que você não precisa comprar.
            </p>
          </div>
          <Link href="/" className="label-large flex h-12 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 no-underline" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            Encontrar planos
            <Icone name="arrow_forward" size={18} />
          </Link>
        </section>
      </Banda>
    </div>
  )
}
