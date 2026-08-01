import type { ReactNode } from 'react'
import {
  InstitutionalCta,
  InstitutionalHero,
  ReadingLayout,
} from './institutional/InstitutionalFoundation'

export interface DocSection {
  title: string
  text: string
}

interface DocPageProps {
  overline: string
  title: string
  intro?: string
  updated?: string
  sections: DocSection[]
  ctaLabel?: string
  ctaTo?: string
  children?: ReactNode
}

// Template único para as 8 rotas de conteúdo (Guia de Implementação v4, §7.3;
// fonte de código `ScreenDoc.dc.html`, componente `renderVals()`) — cada rota
// só fornece overline/título/seções, o layout é sempre o mesmo. `renderVals()`
// do protótipo fixa `cardBg: 'transparent'`, `cardShadow: 'none'`,
// `cardPadding: '0'`, `cardRadius: '0'` e `sectionColumns: 1` incondicionalmente
// (o campo `page.card` do mapa `PAGES` não é lido em lugar nenhum do template) —
// não existe mais distinção visual de "cartão" nem grid de 2/3 colunas: toda
// seção é um bloco simples empilhado, sem fundo/sombra/raio.
export function DocPage({ overline, title, intro, updated, sections, ctaLabel, ctaTo = '/', children }: DocPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5 box-border">
      <InstitutionalHero overline={overline} title={title} summary={intro} meta={updated} />
      <ReadingLayout className="flex flex-col gap-4">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="title-medium m-0">{section.title}</h2>
            <p className="body-small m-0 text-pretty">{section.text}</p>
          </section>
        ))}
      </ReadingLayout>
      {children && <ReadingLayout>{children}</ReadingLayout>}
      {ctaLabel && <InstitutionalCta label={ctaLabel} href={ctaTo} />}
    </div>
  )
}


