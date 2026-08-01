"use client";
import { DocPage, type DocSection } from '../../components/DocPage'
import { PageShell } from '../../components/PageShell'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { PAGE_META } from '../../lib/pageMetaCatalog'

const SECTIONS: DocSection[] = [
  {
    title: '1. Aceitação dos termos',
    text: 'Ao usar o site do SignallQ, você concorda com estes Termos de Uso. Se não concordar, não utilize o site.',
  },
  {
    title: '2. Descrição do serviço',
    text: 'O site oferece teste de velocidade real (download, upload e latência), histórico local de medições e conteúdo institucional sobre o SignallQ e o PRO.',
  },
  {
    title: '3. Uso permitido',
    text: 'Você pode medir e entender sua própria conexão e compartilhar resultados. Não pode usar o site para atacar, sobrecarregar ou interferir na infraestrutura de medição, nem para fins ilegais.',
  },
  {
    title: '4. Gratuidade',
    text: 'O teste e o histórico local são gratuitos e não exigem cadastro. O site pode exibir anúncios quando configurado, sempre após o resultado.',
  },
  {
    title: '5. Disponibilidade',
    text: 'O serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta nem precisão absoluta: o teste depende de infraestrutura de terceiros (Cloudflare).',
  },
  {
    title: '6. Privacidade',
    text: 'O tratamento dos seus dados é regido pela nossa Política de Privacidade, disponível em /privacidade.',
  },
  {
    title: '7. Propriedade intelectual',
    text: 'O SignallQ, incluindo código, design, marca e conteúdo, é propriedade da 7Agents Tecnologia. Todos os direitos reservados.',
  },
  {
    title: '8. Limitação de responsabilidade',
    text: 'A 7Agents não se responsabiliza por danos decorrentes do uso do site, de decisões tomadas com base nos resultados ou de indisponibilidade temporária.',
  },
  {
    title: '9. Alterações nos termos',
    text: 'A 7Agents pode atualizar estes Termos a qualquer momento. O uso continuado após alterações implica aceitação.',
  },
  {
    title: '10. Legislação aplicável',
    text: 'Estes Termos são regidos pelas leis brasileiras, em conformidade com a LGPD (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014).',
  },
  {
    title: '11. Contato',
    text: 'Para dúvidas sobre estes Termos: suporte@signallq.com (7Agents Tecnologia).',
  },
]

export default function Page() {
  useDocumentMeta(PAGE_META['/termos'])

  return (
    <PageShell align="center" mobilePadding="pt-7 px-5 pb-10">
      <DocPage
        overline="Termos de Uso"
        title="Termos de Uso do site SignallQ"
        updated="Última atualização: 18 de julho de 2026"
        sections={SECTIONS}
      />
    </PageShell>
  )
}


