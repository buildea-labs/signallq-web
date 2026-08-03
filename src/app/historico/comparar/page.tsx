import type { Metadata } from "next";
import { HistoryCompareResult } from "@/components/historico/HistoryCompareResult";
import { PAGE_META } from "@/lib/pageMetaCatalog";
import { routeMetadata } from "@/lib/routeMetadata";

export const metadata: Metadata = routeMetadata(PAGE_META["/historico/comparar"]);

// Ids lidos no servidor (query string), não via `useSearchParams` no
// cliente — evita exigir um limite de Suspense só para isto, ao contrário de
// `/historico` (#75, preseleção via `?compare=`), que lê o parâmetro depois
// de montado e por isso precisa do limite.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  return <HistoryCompareResult aId={a} bId={b} />;
}
