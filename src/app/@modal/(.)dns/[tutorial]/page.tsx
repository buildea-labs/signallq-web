import { DnsModal } from "@/components/dns/DnsModal";

export default async function DnsTutorialModalPage({
  params,
}: {
  params: Promise<{ tutorial: string }>;
}) {
  const { tutorial } = await params;
  return <DnsModal isIntercepted={true} activeTutorial={tutorial} />;
}
