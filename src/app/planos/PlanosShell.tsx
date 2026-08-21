'use client'

import { useEffect, useRef, useState } from 'react'
import { EstadoVazio } from '../../components/EstadoVazio'
import { AnalisarConexaoCard } from '../../components/planos/AnalisarConexaoCard'
import { CepForm } from '../../components/planos/CepForm'
import { ComoFunciona } from '../../components/planos/ComoFunciona'
import { ConfiancaSection } from '../../components/planos/ConfiancaSection'
import { FaixaRecomendada } from '../../components/planos/FaixaRecomendada'
import { Icone } from '../../components/planos/Icone'
import { OfertasLista } from '../../components/planos/OfertasLista'
import { PerfilUsoForm } from '../../components/planos/PerfilUsoForm'
import { fetchLocation, fetchRecommendations } from '../../lib/plansClient'
import { listRecords } from '../../lib/measurementRepository'
import type { CurrentConnectionInput, LocationResult, RecommendationResult, UsageProfile } from '../../lib/plansContract'

type Step =
  | 'cep'
  | 'cep_loading'
  | 'cep_invalid'
  | 'cep_not_found'
  | 'location_unavailable'
  | 'profile'
  | 'recommendations_loading'
  | 'recommendations_empty'
  | 'recommendations_ready'
  | 'recommendations_unavailable'

const DEFAULT_PROFILE: UsageProfile = {
  people: 2,
  devices: 4,
  streaming4k: false,
  gaming: false,
  homeOffice: false,
  frequentLargeUploads: false,
  alwaysOnDevices: false,
}

const CEP_INVALID_MESSAGE = 'Digite um CEP válido com 8 dígitos.'

/** Faixa de largura total com miolo centralizado — usada para dar ritmo
 * comercial à página (bandas tintadas alternadas), em vez do container
 * único e estreito das telas de ferramenta. */
function Banda({
  children,
  tint,
  className = '',
}: {
  children: React.ReactNode
  tint?: 'secondary'
  className?: string
}) {
  return (
    <div className="w-full" style={tint === 'secondary' ? { background: 'var(--bg-secondary)' } : undefined}>
      <div className={`mx-auto w-full max-w-[1200px] px-5 lg:px-10 ${className}`}>{children}</div>
    </div>
  )
}

// Orquestrador da jornada de `/planos` (Issue #10). Estado só vive em
// memória — nada é persistido em localStorage/sessionStorage/IndexedDB por
// padrão (CEP, perfil, medição usada e resultado incluídos), conforme a
// seção de privacidade da issue.
export function PlanosShell() {
  const [step, setStep] = useState<Step>('cep')
  const [cep, setCep] = useState('')
  const [location, setLocation] = useState<LocationResult | null>(null)
  const [profile, setProfile] = useState<UsageProfile>(DEFAULT_PROFILE)
  const [measurement, setMeasurement] = useState<CurrentConnectionInput | null>(null)
  const [measurementTimestamp, setMeasurementTimestamp] = useState<number | null>(null)
  const [measurementUnavailable, setMeasurementUnavailable] = useState(false)
  const [result, setResult] = useState<RecommendationResult | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  async function submitCep() {
    if (cep.length !== 8) {
      setStep('cep_invalid')
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStep('cep_loading')
    const response = await fetchLocation(cep, controller.signal)
    if (controller.signal.aborted) return
    if (response.ok) {
      setLocation(response.data)
      setStep('profile')
      return
    }
    if (response.error.code === 'PLANS_CEP_INVALID') setStep('cep_invalid')
    else if (response.error.code === 'PLANS_CEP_NOT_FOUND') setStep('cep_not_found')
    else setStep('location_unavailable')
  }

  function resetToCep() {
    abortRef.current?.abort()
    setLocation(null)
    setResult(null)
    setStep('cep')
  }

  function ajustarPerfil() {
    setStep('profile')
  }

  async function submitProfile() {
    if (!location) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStep('recommendations_loading')
    const response = await fetchRecommendations(
      { ibge: location.ibge, profile, ...(measurement ? { currentConnection: measurement } : {}) },
      controller.signal,
    )
    if (controller.signal.aborted) return
    if (!response.ok) {
      // Correção da Issue #10: se a recommendation API falhar, mostra erro +
      // retry — NUNCA cai para GET /offers como se fosse recomendação.
      setStep('recommendations_unavailable')
      return
    }
    setResult(response.data)
    // `availabilityFit` é a autoridade do backend — nunca re-derivar de
    // `offers.length` aqui.
    setStep(response.data.availabilityFit === 'no_offers' ? 'recommendations_empty' : 'recommendations_ready')
  }

  async function useLastMeasurement() {
    setMeasurementUnavailable(false)
    const records = await listRecords()
    const latest = records[0]
    if (!latest) {
      setMeasurementUnavailable(true)
      return
    }
    setMeasurement({ downloadMbps: latest.download, uploadMbps: latest.upload, latencyMs: latest.latency })
    setMeasurementTimestamp(latest.timestamp)
  }

  function clearMeasurement() {
    setMeasurement(null)
    setMeasurementTimestamp(null)
  }

  const showCepHero =
    step === 'cep' || step === 'cep_loading' || step === 'cep_invalid' || step === 'cep_not_found' || step === 'location_unavailable'
  const showJourney = location !== null && !showCepHero

  return (
    <div className="flex w-full flex-col">
      {showCepHero && (
        <Banda>
          <CepForm
            cep={cep}
            onCepChange={setCep}
            onSubmit={submitCep}
            loading={step === 'cep_loading'}
            errorMessage={step === 'cep_invalid' ? CEP_INVALID_MESSAGE : undefined}
            measurement={measurement}
            measurementTimestamp={measurementTimestamp}
            onUseLastMeasurement={useLastMeasurement}
            onClearMeasurement={clearMeasurement}
            measurementUnavailable={measurementUnavailable}
          />
        </Banda>
      )}

      {step === 'cep_loading' && (
        <Banda className="pb-8">
          <p role="status" aria-live="polite" className="body-large text-center text-[color:var(--text-secondary)]">
            Buscando sua localização…
          </p>
        </Banda>
      )}

      {step === 'cep_not_found' && (
        <Banda className="pb-8">
          <EstadoVazio
            icon="location_off"
            title="CEP não encontrado"
            message="Não encontramos esse CEP. Confira os números e tente novamente."
            actionLabel="Tentar outro CEP"
            actionVariant="outline"
            onAction={resetToCep}
          />
        </Banda>
      )}

      {step === 'location_unavailable' && (
        <Banda className="pb-8">
          <EstadoVazio
            icon="wifi_off"
            title="Serviço de localização indisponível"
            message="Não conseguimos verificar seu CEP agora. Tente novamente em instantes."
            actionLabel="Tentar novamente"
            actionVariant="outline"
            onAction={submitCep}
          />
        </Banda>
      )}

      {showJourney && location && (
        <>
          {(step === 'profile' || step === 'recommendations_loading' || step === 'recommendations_unavailable') && (
            <Banda className="py-12 lg:py-16">
              <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
                <Icone name="location_on" size={20} color="var(--accent)" />
                <span className="body-large">
                  {location.city}, {location.state}
                </span>
                <button type="button" onClick={resetToCep} className="label-large underline" style={{ color: 'var(--accent)' }}>
                  Trocar CEP
                </button>
              </div>
              <PerfilUsoForm
                profile={profile}
                onProfileChange={setProfile}
                onSubmit={submitProfile}
                loading={step === 'recommendations_loading'}
                measurement={measurement}
              />
            </Banda>
          )}

          {step === 'recommendations_loading' && (
            <Banda className="pb-10">
              <p role="status" aria-live="polite" className="body-large text-center text-[color:var(--text-secondary)]">
                Calculando a faixa recomendada…
              </p>
            </Banda>
          )}

          {step === 'recommendations_unavailable' && (
            <Banda className="pb-12">
              <EstadoVazio
                icon="cloud_off"
                title="Não foi possível calcular sua recomendação"
                message="O serviço de recomendação está indisponível agora. Seu perfil não foi perdido — tente novamente."
                actionLabel="Tentar novamente"
                actionVariant="outline"
                onAction={submitProfile}
              />
            </Banda>
          )}

          {step === 'recommendations_empty' && (
            <Banda className="py-12">
              <EstadoVazio
                icon="search_off"
                title="Sem ofertas para esta região"
                message="Ainda não temos ofertas cadastradas para o seu município no catálogo do SignallQ."
                actionLabel="Tentar outro CEP"
                actionVariant="outline"
                onAction={resetToCep}
              />
            </Banda>
          )}

          {step === 'recommendations_ready' && result && (
            <Banda tint="secondary" className="py-12 lg:py-16">
              <OfertasLista
                offers={result.offers}
                location={location}
                onTrocarLocalizacao={resetToCep}
                availabilityFit={result.availabilityFit}
              >
                <FaixaRecomendada
                  range={result.recommendedRange}
                  marketTier={result.marketTier}
                  profile={profile}
                  onAjustarPerfil={ajustarPerfil}
                />
              </OfertasLista>
            </Banda>
          )}
        </>
      )}

      <Banda className="pb-12 pt-4 lg:pb-16 lg:pt-6">
        <AnalisarConexaoCard />
      </Banda>

      <Banda className="pb-16 lg:pb-20">
        <ComoFunciona />
      </Banda>

      <Banda tint="secondary" className="py-12 lg:py-14">
        <ConfiancaSection />
        <p className="body-small mt-10 text-center text-[color:var(--text-tertiary)]">
          Seu CEP, perfil de uso, medição utilizada e o resultado da recomendação não são salvos por padrão — tudo acontece só nesta sessão
          do navegador.
        </p>
      </Banda>
    </div>
  )
}
