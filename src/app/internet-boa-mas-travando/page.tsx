import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { InternetBoaMasTravandoClient } from "./InternetBoaMasTravandoClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/internet-boa-mas-travando"])

export default function Page() {
  return <InternetBoaMasTravandoClient />
}
