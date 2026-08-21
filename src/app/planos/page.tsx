import type { Metadata } from 'next'
import { PAGE_META } from '../../lib/pageMetaCatalog'
import { routeMetadata } from '../../lib/routeMetadata'
import { PlanosShell } from './PlanosShell'

export const metadata: Metadata = routeMetadata(PAGE_META['/planos'])

// Sem `PageShell`: esta é a única landing page comercial do site e precisa
// de bandas de largura total com miolo próprio (ver `Banda` em
// `PlanosShell`), enquanto o `PageShell` existe para o container único e
// estreito das telas de ferramenta.
export default function Page() {
  return <PlanosShell />
}
