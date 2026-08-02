import type { Metadata } from 'next'
import { PAGE_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { HomeClient } from "./HomeClient"

export const metadata: Metadata = routeMetadata(PAGE_META["/"])

export default function Home() {
  return <HomeClient />
}
