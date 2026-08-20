// Composição de "casa conectada" do hero de `/planos` — meta visual da
// referência 01 (casa + dispositivos + rótulos de uso flutuantes). SVG
// autoral no mesmo idioma das ilustrações já existentes do site
// (`InstitutionalIllustrations.tsx`): traço leve, apenas tokens do
// SignallQ 2.0, decorativo (`aria-hidden`) porque a informação equivalente
// já está no texto do hero. Os rótulos são categorias de uso genéricas —
// nenhum dado de operadora, preço ou velocidade.
export function HeroIlustracao() {
  return (
    <div aria-hidden="true" className="w-full select-none">
      <svg viewBox="0 0 520 380" className="h-auto w-full" fill="none">
        {/* halo de fundo */}
        <ellipse cx="286" cy="250" rx="210" ry="120" fill="var(--bg-secondary)" opacity=".7" />

        {/* silhueta da casa */}
        <path
          d="M150 210 286 108l136 102v128a10 10 0 0 1-10 10H160a10 10 0 0 1-10-10V210Z"
          fill="var(--bg-card)"
          stroke="var(--border)"
          strokeWidth="2"
          opacity=".55"
        />
        <path d="M132 218 286 100l154 118" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" opacity=".45" />

        {/* selo central de Wi-Fi */}
        <circle cx="286" cy="212" r="42" fill="var(--accent)" />
        <path d="M266 210c12-13 28-13 40 0" stroke="var(--on-accent)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M274 220c7-8 17-8 24 0" stroke="var(--on-accent)" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="286" cy="231" r="3.6" fill="var(--on-accent)" />

        {/* conexões tracejadas até os dispositivos */}
        <path
          d="M286 254v34M286 288H196v26M286 288h92v26M250 254l-52-26M322 254l52-26"
          stroke="var(--accent)"
          strokeWidth="1.6"
          strokeDasharray="4 7"
          opacity=".5"
          strokeLinecap="round"
        />

        {/* TV */}
        <rect x="248" y="292" width="76" height="48" rx="5" fill="var(--accent)" opacity=".9" />
        <path d="M276 346h20" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />

        {/* notebook */}
        <rect x="164" y="300" width="64" height="40" rx="4" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
        <path d="M156 344h80" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <path d="m190 313 14 8-14 8v-16Z" fill="var(--accent)" opacity=".8" />

        {/* celular */}
        <rect x="352" y="296" width="30" height="48" rx="6" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
        <path d="M363 338h8" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />

        {/* controle de videogame */}
        <path
          d="M404 316c0-8 7-13 15-12l10 1h8l10-1c8-1 15 4 15 12 0 10-5 22-12 22-5 0-8-4-11-8h-12c-3 4-6 8-11 8-7 0-12-12-12-22Z"
          fill="var(--bg-card)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <path d="M416 322v8M412 326h8M446 324h.01M440 330h.01" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />

        {/* planta decorativa */}
        <path d="M104 344c0-22 8-38 18-38s18 16 18 38" stroke="var(--accent)" strokeWidth="2" opacity=".5" strokeLinecap="round" />
        <path d="M112 330h20l-3 14h-14l-3-14Z" fill="var(--bg-secondary)" stroke="var(--accent)" strokeWidth="2" opacity=".7" />

        {/* rótulos de uso flutuantes */}
        <g>
          <rect x="332" y="36" width="150" height="38" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.4" />
          <text x="350" y="60" fill="var(--text-primary)" fontFamily="var(--font-sans)" fontSize="14" fontWeight="500">
            Streaming em 4K
          </text>
        </g>
        <g>
          <rect x="366" y="112" width="146" height="38" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.4" />
          <text x="384" y="136" fill="var(--text-primary)" fontFamily="var(--font-sans)" fontSize="14" fontWeight="500">
            Trabalho em casa
          </text>
        </g>
        <g>
          <rect x="12" y="150" width="168" height="38" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.4" />
          <text x="30" y="174" fill="var(--text-primary)" fontFamily="var(--font-sans)" fontSize="14" fontWeight="500">
            Vários dispositivos
          </text>
        </g>
        <g>
          <rect x="374" y="212" width="138" height="38" rx="10" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.4" />
          <text x="392" y="236" fill="var(--text-primary)" fontFamily="var(--font-sans)" fontSize="14" fontWeight="500">
            Jogos online
          </text>
        </g>
      </svg>
    </div>
  )
}
