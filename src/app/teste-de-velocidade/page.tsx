import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { TesteVelocidadeClient } from "./TesteVelocidadeClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/teste-de-velocidade"])

export default function TesteVelocidade() {
  return <TesteVelocidadeClient />
}
