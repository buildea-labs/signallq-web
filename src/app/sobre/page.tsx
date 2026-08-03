import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '../../components/PageShell'
import {
  HighlightSection,
  InstitutionalCta,
  InstitutionalHero,
  ReadingLayout,
} from '../../components/institutional/InstitutionalFoundation'
import { ConnectionIllustration } from '../../components/institutional/InstitutionalIllustrations'
import { PAGE_META } from '../../lib/pageMetaCatalog'
import { routeMetadata } from '../../lib/routeMetadata'

export const metadata: Metadata = routeMetadata(PAGE_META['/sobre'])

export default function Page() {
  return (
    <PageShell contentMax="860px" mobilePadding="pt-7 px-5 pb-10">
      <ReadingLayout className="flex flex-col gap-7">
        <InstitutionalHero
          title="Sobre o SignallQ"
          summary="Criamos o SignallQ para ajudar qualquer pessoa a entender melhor a própria internet."
          illustration={<ConnectionIllustration />}
        />
        <HighlightSection title="Por que existimos">
          <p>Testes tradicionais de velocidade mostram números, mas não explicam o que eles significam para quem está usando a internet. O SignallQ busca interpretar o resultado e indicar próximos passos, sem prometer descobrir toda causa de um problema de conexão.</p>
        </HighlightSection>
        <HighlightSection title="O que fazemos">
          <p>O SignallQ é gratuito. O teste web está disponível em beta; o aplicativo Android está em teste fechado. Ele ajuda qualquer pessoa a medir e entender a própria conexão: Wi‑Fi, fibra, DNS ou sinal móvel.</p>
        </HighlightSection>
        <HighlightSection title="O que o SignallQ faz">
          <div className="flex flex-col gap-3">
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5">
              <li>Medir a conexão em segundos, direto no navegador.</li>
              <li>Interpretar os resultados em linguagem simples, sem jargão técnico.</li>
              <li>Aprofundar a análise quando há indício de um problema.</li>
              <li>
                Manter um histórico local no navegador para comparar medições ao longo do tempo —
                veja como tratamos esses dados em <Link href="/privacidade">Privacidade</Link>.
              </li>
            </ul>
            <p className="m-0">
              Recursos como sinal Wi‑Fi, rede móvel, informações de dispositivo e outras análises
              nativas podem depender do{' '}
              <Link href="/app">aplicativo Android</Link>.
            </p>
          </div>
        </HighlightSection>
        <HighlightSection title="Medição não é adivinhação">
          <p>
            O SignallQ separa o que foi medido, o que é um sinal de possível problema e quando não
            há dados suficientes para concluir — por isso um resultado pode aparecer como parcial,
            inconclusivo ou com confiança baixa, em vez de uma causa definitiva. Veja os detalhes em{' '}
            <Link href="/como-medimos">Como medimos</Link>.
          </p>
        </HighlightSection>
        <InstitutionalCta label="Testar minha internet" href="/" supportingText="Comece pelo teste direto, sem cadastro." />
      </ReadingLayout>
    </PageShell>
  )
}
