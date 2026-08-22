import { Banda } from "@/components/Banda";
import { JogosModal } from "@/components/jogos/JogosModal";

export default function JogosPage() {
  return (
    <Banda className="py-8 md:py-12 lg:py-16">
      <JogosModal isIntercepted={false} />
    </Banda>
  );
}
