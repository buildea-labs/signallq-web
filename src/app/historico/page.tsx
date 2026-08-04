import type { Metadata } from 'next'
import { Suspense } from "react"
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { HistoricoClient } from "./HistoricoClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/historico"])

export default function Page() {
  // `useHistoryController` lê `?compare=<id>` via `useSearchParams` (#75,
  // pré-seleção vinda do detalhe) — exige um limite de Suspense ao redor de
  // quem a chama.
  return (
    <Suspense fallback={null}>
      <HistoricoClient />
    </Suspense>
  )
}
