import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { HistoryDetail } from "@/components/historico/HistoryDetail"

export const metadata: Metadata = routeMetadata(PAGE_META["/historico/[id]"])

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <HistoryDetail id={id} />
}
