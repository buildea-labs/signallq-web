import type { MarketTier, RecommendationProfile, RecommendedRange } from '../../lib/plansContract'
import { IconeSelo } from './Icone'

// Frase de conforto por tier — texto editorial, não número. A faixa em
// Mbps exibida vem sempre de `range.label`, formatada pelo backend (engine
// v1). Nunca hardcodar Mbps aqui.
const TIER_PHRASES: Record<MarketTier, string> = {
  LIGHT: 'é uma faixa tranquila',
  MODERATE: 'é uma faixa equilibrada',
  CONNECTED_FAMILY: 'é uma faixa confortável',
  INTENSIVE: 'é uma faixa robusta',
  VERY_INTENSIVE: 'é uma faixa de alta demanda',
}

const HABIT_LABELS: Array<[keyof RecommendationProfile, string]> = [
  ['streaming4k', 'streaming em 4K'],
  ['gaming', 'jogos online'],
  ['homeOffice', 'trabalho em casa'],
  ['largeUploads', 'uploads grandes'],
  ['alwaysOnDevices', 'câmeras sempre ligadas'],
]

function joinWithE(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

/** Paráfrase do perfil que a própria pessoa usuária informou — não é dado
 * do backend nem inferência, só reapresenta o que ela escolheu. */
function summarizeProfile(profile: RecommendationProfile): string {
  const habits = HABIT_LABELS.filter(([key]) => profile[key]).map(([, label]) => label)
  const habitsText = habits.length > 0 ? `Você usa ${joinWithE(habits)}` : 'Você usa a internet no dia a dia'
  return `${habitsText} e tem cerca de ${profile.devices} dispositivos conectados.`
}

interface FaixaRecomendadaProps {
  range: RecommendedRange
  profile: RecommendationProfile
  onAjustarPerfil: () => void
}

// Momento de descoberta personalizada da jornada (referência 01): banda
// destacada em superfície de sucesso, faixa em tipografia grande, motivo
// resumido ao lado e CTA de ajuste. Extensão específica de `/planos` —
// `FaixaMetricas` resolve outro problema (trio de métricas medidas).
export function FaixaRecomendada({ range, profile, onAjustarPerfil }: FaixaRecomendadaProps) {
  return (
    <section
      className="flex w-full flex-col gap-5 rounded-[20px] p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8"
      style={{ background: 'color-mix(in srgb, var(--success-container) 55%, var(--bg-card))' }}
    >
      <div className="flex items-start gap-4">
        <IconeSelo name="verified" box={48} size={26} radius="9999px" background="var(--success)" color="var(--bg-card)" />
        <div className="flex flex-col gap-0.5">
          <span className="label-overline" style={{ color: 'var(--on-success-container)' }}>
            Para o seu uso
          </span>
          <span
            className="text-[30px] leading-[1.15] font-bold tracking-[-0.3px] sm:text-[34px]"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--on-success-container)' }}
          >
            {range.label}
          </span>
          <span className="body-large" style={{ color: 'var(--on-success-container)' }}>
            {TIER_PHRASES[range.tier]}.
          </span>
        </div>
      </div>

      <p className="body-medium m-0 flex-1" style={{ color: 'var(--on-success-container)' }}>
        {summarizeProfile(profile)}
      </p>

      <button
        type="button"
        onClick={onAjustarPerfil}
        className="label-large flex h-11 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border px-5"
        style={{ borderColor: 'var(--on-success-container)', color: 'var(--on-success-container)' }}
      >
        Ajustar meu perfil
      </button>
    </section>
  )
}
