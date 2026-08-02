import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { LagEmJogosOnlineClient } from "./LagEmJogosOnlineClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/lag-em-jogos-online"])

export default function Page() {
  return <LagEmJogosOnlineClient />
}
