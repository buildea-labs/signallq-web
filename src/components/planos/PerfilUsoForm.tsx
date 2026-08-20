import type { CurrentConnectionInput, RecommendationProfile } from '../../lib/plansContract'
import { Icone } from './Icone'

interface UsageToggle {
  key: keyof Pick<RecommendationProfile, 'streaming4k' | 'gaming' | 'homeOffice' | 'largeUploads' | 'alwaysOnDevices'>
  icon: string
  label: string
}

const TOGGLES: UsageToggle[] = [
  { key: 'streaming4k', icon: 'live_tv', label: 'Streaming em 4K' },
  { key: 'gaming', icon: 'sports_esports', label: 'Jogos online' },
  { key: 'homeOffice', icon: 'laptop_mac', label: 'Trabalho em casa' },
  { key: 'largeUploads', icon: 'cloud_upload', label: 'Uploads grandes' },
  { key: 'alwaysOnDevices', icon: 'videocam', label: 'Câmeras sempre ligadas' },
]

interface CounterFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

function CounterField({ label, value, onChange, min = 1, max = 20 }: CounterFieldProps) {
  return (
    <div className="flex flex-1 flex-col items-start gap-2">
      <span className="label-large">{label}</span>
      <div
        className="flex items-center gap-4 rounded-[var(--radius-pill)] px-3 py-1.5"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
      >
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent disabled:opacity-40"
          style={{ color: 'var(--accent)' }}
        >
          <Icone name="remove" size={20} />
        </button>
        <span className="w-8 text-center text-[20px] font-bold tabular-nums" style={{ fontFamily: 'var(--font-sans)' }} aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-transparent disabled:opacity-40"
          style={{ color: 'var(--accent)' }}
        >
          <Icone name="add" size={20} />
        </button>
      </div>
    </div>
  )
}

interface PerfilUsoFormProps {
  profile: RecommendationProfile
  onProfileChange: (profile: RecommendationProfile) => void
  onSubmit: () => void
  loading: boolean
  /** Só preenchida via ação explícita no hero ("Usar minha medição") —
   * este formulário apenas exibe o que já foi escolhido. */
  measurement: CurrentConnectionInput | null
}

// Perfil de uso da casa — pessoas/dispositivos e hábitos (elementos
// exigidos pela Issue #10). Apresentado como etapa comercial da jornada
// (título grande, chips generosos), não como formulário técnico.
export function PerfilUsoForm({ profile, onProfileChange, onSubmit, loading, measurement }: PerfilUsoFormProps) {
  return (
    <section className="flex w-full flex-col items-center gap-8">
      <div className="flex max-w-[560px] flex-col items-center gap-3 text-center">
        <span className="label-overline">Etapa 2 de 2</span>
        <h2 className="m-0 text-[30px] leading-[1.18] font-bold tracking-[-0.3px] sm:text-[36px]" style={{ fontFamily: 'var(--font-sans)' }}>
          Como é o uso da sua casa?
        </h2>
        <p className="body-large m-0 text-[color:var(--text-secondary)]">
          Isso define a faixa de velocidade que realmente faz sentido — não a mais cara, a que cabe no seu dia a dia.
        </p>
      </div>

      {measurement && (
        <div className="flex items-center gap-2">
          <Icone name="check_circle" size={18} color="var(--success)" />
          <span className="body-medium text-[color:var(--text-secondary)]">Sua última medição será usada para refinar esta recomendação.</span>
        </div>
      )}

      <div className="flex w-full max-w-[460px] flex-wrap gap-6">
        <CounterField label="Pessoas na casa" value={profile.people} onChange={(people) => onProfileChange({ ...profile, people })} />
        <CounterField
          label="Dispositivos conectados"
          value={profile.devices}
          onChange={(devices) => onProfileChange({ ...profile, devices })}
          max={40}
        />
      </div>

      <div className="flex max-w-[640px] flex-wrap justify-center gap-3" role="group" aria-label="Hábitos de uso">
        {TOGGLES.map((toggle) => {
          const active = profile[toggle.key]
          return (
            <button
              key={toggle.key}
              type="button"
              aria-pressed={active}
              onClick={() => onProfileChange({ ...profile, [toggle.key]: !active })}
              className="label-large flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-3 transition-colors"
              style={
                active
                  ? { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid var(--accent)' }
                  : { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
              }
            >
              <Icone name={toggle.icon} size={18} />
              <span className="whitespace-nowrap">{toggle.label}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="label-large flex h-13 items-center justify-center rounded-[var(--radius-pill)] px-8 py-4 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        {loading ? 'Calculando…' : 'Ver minha recomendação'}
      </button>
    </section>
  )
}
