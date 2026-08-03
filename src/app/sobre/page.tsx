import type { Metadata } from 'next'
import { PageShell } from '../../components/PageShell'
import {
  HighlightSection,
  InformationGroup,
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
          overline="Quem somos"
          title="Conectividade explicada, não só medida"
          summary="Mostrar a métrica é só o começo: o valor está em explicar o que ela significa na prática, em português claro."
          illustration={<ConnectionIllustration />}
        />
        <HighlightSection title="O que fazemos">
          <p>O SignallQ é gratuito. O teste web está disponível em beta; o aplicativo Android está em teste fechado. Ele ajuda qualquer pessoa a medir e entender a própria conexão: Wi‑Fi, fibra, DNS ou sinal móvel.</p>
        </HighlightSection>
        <section className="flex flex-col gap-3" aria-labelledby="approach-title">
          <h2 id="approach-title" className="title-large m-0">Da medida para a ação</h2>
          <InformationGroup items={[
            { label: 'Problema', value: 'Uma conexão pode ter velocidade alta e ainda travar, oscilar ou responder devagar.' },
            { label: 'Abordagem', value: 'O Site/PWA mede no navegador e organiza o resultado; o app Android amplia a leitura com recursos do aparelho.' },
            { label: 'Objetivo', value: 'Tornar diagnósticos de rede mais compreensíveis e acionáveis, sem exigir conhecimento técnico.' },
          ]} />
        </section>
        <HighlightSection title="Site/PWA e Android">
          <p>São experiências complementares. O site permite medir e acompanhar o histórico local no navegador; o Android pode acessar sinais e recursos de rede que o navegador não expõe.</p>
        </HighlightSection>
        <InstitutionalCta label="Testar minha internet" href="/" supportingText="Comece pelo teste direto, sem cadastro." />
      </ReadingLayout>
    </PageShell>
  )
}
