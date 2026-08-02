import { EstadoVazio } from "@/components/EstadoVazio";

// Título fica sempre fixo no topo (Guia §7.2) — só o bloco de estado
// (carregando/indisponível/vazio) centraliza no espaço vertical que
// sobra abaixo dele, nunca a página inteira como uma unidade só.
export function HistoryLoadingState() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
      <span className="material-symbols-outlined text-[28px] text-[color:var(--text-tertiary)]">
        hourglass_top
      </span>
      <div className="font-normal text-[16px] leading-[1.5] text-[color:var(--text-primary)]">Carregando histórico…</div>
    </div>
  );
}

export function HistoryUnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <EstadoVazio
        card
        icon="storage"
        iconSize={32}
        messageSize={14}
        color="var(--error)"
        title="Histórico indisponível"
        message="Não foi possível ler o armazenamento local deste navegador agora."
        actionLabel="Tentar novamente"
        actionVariant="outline"
        onAction={onRetry}
      />
    </div>
  );
}

export function HistoryEmptyState({ onStartTest }: { onStartTest: () => void }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center">
      <EstadoVazio
        icon="speed"
        iconSize={36}
        messageSize={14}
        color="var(--text-tertiary)"
        title="Nenhuma medição ainda"
        message="Faça seu primeiro teste para ver o histórico aqui."
        actionIcon="speed"
        actionLabel="Testar velocidade"
        onAction={onStartTest}
      />
    </div>
  );
}
