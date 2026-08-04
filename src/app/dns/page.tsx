import { PageShell } from "@/components/PageShell";
import { DnsModal } from "@/components/dns/DnsModal";

export default function DnsPage() {
  return (
    <PageShell align="center" contentMax="860px">
      <DnsModal isIntercepted={false} />
    </PageShell>
  );
}
