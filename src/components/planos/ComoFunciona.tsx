import { IconeSelo } from './Icone'

const BENEFITS = [
  { icon: 'tune', title: 'Escolher', description: 'Veja quais planos combinam com o seu uso e com a sua região.' },
  { icon: 'menu_book', title: 'Entender', description: 'Descubra se o que você paga faz sentido para a sua casa.' },
  { icon: 'support', title: 'Resolver', description: 'Entenda o que pode estar acontecendo quando a internet vai mal.' },
]

const STEPS = [
  { title: 'Entendemos seu uso', description: 'Perguntamos sobre sua casa e como vocês usam a internet.' },
  { title: 'Observamos sua conexão', description: 'Testes simples e objetivos, quando fazem diferença.' },
  { title: 'Consultamos as ofertas', description: 'Mapeamos planos e preços disponíveis na sua região.' },
  { title: 'Explicamos a recomendação', description: 'Você entende o porquê e escolhe com confiança.' },
]

// Bloco editorial de suporte comercial (referência 02). Sem cardificar:
// benefícios em colunas com selo de ícone e sem borda; etapas numeradas em
// linha com conector, apoiadas em respiro em vez de container fechado.
export function ComoFunciona() {
  return (
    <section className="flex w-full flex-col gap-14">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <IconeSelo
                name={benefit.icon}
                box={48}
                size={24}
                radius="14px"
                background="color-mix(in srgb, var(--accent) 10%, transparent)"
                color="var(--accent)"
              />
              <span className="title-large">{benefit.title}</span>
            </div>
            <span className="body-large text-[color:var(--text-secondary)]">{benefit.description}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="label-overline">Como funciona</span>
          <h2 className="m-0 max-w-[520px] text-[28px] leading-[1.2] font-bold tracking-[-0.3px]" style={{ fontFamily: 'var(--font-sans)' }}>
            Uma recomendação que você entende
          </h2>
        </div>

        <ol className="m-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-sans)' }}
                >
                  {index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-px flex-1 lg:block"
                  style={{ background: index < STEPS.length - 1 ? 'color-mix(in srgb, var(--border) 40%, transparent)' : 'transparent' }}
                />
              </div>
              <span className="title-medium">{step.title}</span>
              <span className="body-medium text-[color:var(--text-secondary)]">{step.description}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
