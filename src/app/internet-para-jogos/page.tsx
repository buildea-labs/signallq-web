import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { InternetParaJogosClient } from "./InternetParaJogosClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/internet-para-jogos"])

export default function Page() {
  return <InternetParaJogosClient />
}
