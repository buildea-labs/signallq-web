import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { HistoricoClient } from "./HistoricoClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/historico"])

export default function Page() {
  return <HistoricoClient />
}
