import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { FerramentasClient } from "./FerramentasClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/ferramentas"])

export default function Ferramentas() {
  return <FerramentasClient />
}
