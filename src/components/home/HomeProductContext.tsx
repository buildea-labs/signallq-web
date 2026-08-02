import { LinhaChips } from "@/components/LinhaChips";
import { DIAG_ITEMS } from "./homeCopy";

/** Contexto de produto exibido no repouso: diagnóstico e diferencial do app. */
export function HomeProductContext({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="w-full flex flex-col gap-4 pt-3">
      <div className="flex flex-col gap-[2px] text-center">
        <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--accent)] tracking-[.3px] uppercase">
          Diagnóstico, não só velocidade
        </div>
        <h2 className="m-0 font-bold text-[20px] leading-[1.3] text-[color:var(--text-primary)]">
          O SignallQ explica por que, não só quanto
        </h2>
      </div>

      <LinhaChips items={DIAG_ITEMS} />

      <div className="flex flex-wrap items-center gap-4 rounded-[20px] py-5 px-[22px] box-border bg-[linear-gradient(135deg,_color-mix(in_srgb,_var(--accent)_16%,_var(--bg-secondary)),_var(--bg-secondary))] shadow-[0_16px_40px_rgba(0,0,0,.22),_inset_0_1px_0_rgba(255,255,255,.05)]">
        <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1">
          <div className="font-medium text-[11px] leading-[1.45] text-[color:var(--text-tertiary)] tracking-[.3px] uppercase">
            Só no app SignallQ
          </div>
          <div className="font-semibold text-[16px] leading-[1.35] text-[color:var(--text-primary)]">
            Wi-Fi cômodo a cômodo, sinal móvel e mais
          </div>
          <div className="font-normal text-[13px] leading-[1.45] text-[color:var(--text-secondary)]">
            O navegador não lê rádio Wi-Fi nem sinal 4G/5G. O app mede isso e mostra os dispositivos conectados à
            sua rede.
          </div>
        </div>
      </div>
    </div>
  );
}
