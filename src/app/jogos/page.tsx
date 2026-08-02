import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { JogosClient } from "./JogosClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/jogos"])

export default function Page() {
  return <JogosClient />
}
