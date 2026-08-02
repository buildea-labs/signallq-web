import type { Metadata } from 'next'
import { NOT_FOUND_META } from "@/lib/pageMetaCatalog"
import { routeMetadata } from "@/lib/routeMetadata"
import { NotFoundClient } from "./NotFoundClient"

export const metadata: Metadata = routeMetadata(NOT_FOUND_META)

export default function NotFound() {
  return <NotFoundClient />
}
