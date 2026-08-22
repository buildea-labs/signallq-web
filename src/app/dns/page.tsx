import { Banda } from "@/components/Banda";
import { DnsModal } from "@/components/dns/DnsModal";

export default function DnsPage() {
  return (
    <Banda className="py-8 md:py-12 lg:py-16">
      <DnsModal isIntercepted={false} />
    </Banda>
  );
}
