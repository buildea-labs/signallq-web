import Link from "next/link";

/**
 * Volta de uma ferramenta aberta em página inteira (`/ping`, `/dns`, `/jogos`,
 * `/meu-ip`) para a rota de Velocidade.
 *
 * É um `<Link>` de verdade, não `router.back()`, porque numa página inteira
 * não há como saber para onde `back()` leva: este Next não guarda índice em
 * `history.state`, `history.length` acumula a aba inteira e `document.referrer`
 * vem vazio em navegação client-side. Quem chega por link externo, busca ou
 * PWA instalada não tem entrada anterior no app — `back()` sairia do site ou
 * não faria nada, que foi exatamente a queixa: tela sem saída.
 *
 * Dentro do modal interceptado o caso é outro e `router.back()` continua certo
 * lá: existe uma entrada anterior por construção, e voltar é o que descarta a
 * sobreposição.
 */
export function ToolBackLink({ label = "Voltar para Velocidade" }: { label?: string }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-full pr-3 font-semibold text-[13px] text-[color:var(--accent)] no-underline hover:underline"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
        arrow_back
      </span>
      {label}
    </Link>
  );
}
