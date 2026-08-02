import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { DnsClient } from "./DnsClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/dns"])

export default function Page() {
  return <DnsClient />
}
