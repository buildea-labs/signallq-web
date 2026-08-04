import { PageShell } from "@/components/PageShell";
import { JogosModal } from "@/components/jogos/JogosModal";

export default function JogosPage() {
  return (
    <PageShell align="center" contentMax="860px">
      <JogosModal isIntercepted={false} />
    </PageShell>
  );
}
