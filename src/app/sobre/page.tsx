import type { Metadata } from 'next'
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
        <HighlightSection title="Site/PWA e Android">
          <p>São experiências complementares. O site permite medir e acompanhar o histórico local no navegador; o Android pode acessar sinais e recursos de rede que o navegador não expõe.</p>
        </HighlightSection>
        <InstitutionalCta label="Testar minha internet" href="/" supportingText="Comece pelo teste direto, sem cadastro." />
      </ReadingLayout>
    </PageShell>
  )
}
