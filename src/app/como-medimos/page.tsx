import type { Metadata } from 'next'
import { PageShell } from '../../components/PageShell'
import {
  AccessibleAccordion,
  HighlightSection,
  InformationGroup,
  InstitutionalCta,
  InstitutionalHero,
  ReadingLayout,
  StepsBlock,
} from '../../components/institutional/InstitutionalFoundation'
import { MeasurementIllustration } from '../../components/institutional/InstitutionalIllustrations'
import { PAGE_META } from '../../lib/pageMetaCatalog'
import { routeMetadata } from '../../lib/routeMetadata'

export const metadata: Metadata = routeMetadata(PAGE_META['/como-medimos'])

export default function Page() {
  return (
    <PageShell contentMax="860px" mobilePadding="pt-7 px-5 pb-10">
      <ReadingLayout className="flex flex-col gap-7">
        <InstitutionalHero overline="Metodologia" title="Como medimos sua conexão" summary="O que foi medido, como interpretamos e o que um teste no navegador não consegue afirmar." illustration={<MeasurementIllustration />} />
        <StepsBlock title="O caminho da medição" steps={[
          { title: 'Navegador', description: 'O teste envia e recebe dados por HTTPS e faz solicitações curtas para observar o tempo de resposta.' },
          { title: 'Infraestrutura Cloudflare', description: 'Os endpoints de medição e DNS respondem às requisições; a borda atendida depende do roteamento da rede.' },
          { title: 'Métricas', description: 'Organizamos download, upload, latência, jitter, variação sob carga e estabilidade da execução.' },
          { title: 'Leitura e próxima ação', description: 'A leitura diagnóstica local resume aquela execução e sugere o próximo passo; ela não confirma a velocidade contratada.' },
        ]} />
        <InformationGroup title="O que cada modo muda" items={[
          { label: 'Rápido', value: 'Usa 15 amostras de latência e cerca de 7 segundos para download e upload. É uma triagem curta.' },
          { label: 'Completo', value: 'Usa 25 amostras e cerca de 18 segundos para cada etapa de transferência, com maior orçamento de amostras.' },
          { label: 'Em ambos', value: 'A leitura é específica daquela execução. Condições diferentes pedem um novo teste comparável.' },
        ]} />
        <HighlightSection title="Velocidade não é toda a experiência">
          <p>Velocidade indica quanto dado passou. Latência indica o tempo de resposta. Jitter e estabilidade mostram a variação. Uma conexão pode ter boa velocidade e ainda responder lentamente.</p>
        </HighlightSection>
        <AccessibleAccordion title="Limites e variações" items={[
          { title: 'Por que o resultado pode variar', defaultOpen: true, content: <p>Wi‑Fi, distância do roteador, interferência, aparelhos usando a rede, congestionamento, navegador e rota até o servidor podem alterar o resultado. Para comparar, repita o teste nas mesmas condições.</p> },
          { title: 'O que o navegador não mede', content: <p>O navegador não mede sinal Wi‑Fi, não envia ping ICMP e não confirma seu provedor ou localização. A medição web não é um laudo regulatório nem uma certificação formal.</p> },
        ]} />
        <InstitutionalCta label="Iniciar teste" href="/" />
      </ReadingLayout>
    </PageShell>
  )
}


