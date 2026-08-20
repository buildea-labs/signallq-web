import { IconeSelo } from './Icone'

const PILLARS = [
  {
    icon: 'shield',
    title: 'Informação confiável',
    description: 'Dados de ofertas vindos do catálogo oficial do SignallQ, não de estimativa nossa.',
  },
  {
    icon: 'target',
    title: 'Feito para você',
    description: 'A recomendação parte do uso que você descreveu e da sua localização.',
  },
  {
    icon: 'balance',
    title: 'Compare sem viés',
    description: 'O ranking é orgânico: nenhuma operadora paga para aparecer antes.',
  },
  {
    icon: 'lock',
    title: 'Privacidade primeiro',
    description: 'Seu CEP e seu perfil não são salvos nem compartilhados com operadoras.',
  },
]

// Área de confiança perto do fim da página (referência 01): banda em
// superfície tintada, 4 pilares com ícone em contorno e texto curto.
export function ConfiancaSection() {
  return (
    <section className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {PILLARS.map((pillar) => (
        <div key={pillar.title} className="flex gap-3">
          <IconeSelo name={pillar.icon} box={44} size={22} radius="9999px" border="1.5px solid var(--accent)" color="var(--accent)" />
          <div className="flex flex-col gap-1">
            <span className="title-small" style={{ color: 'var(--accent)' }}>
              {pillar.title}
            </span>
            <span className="body-medium text-[color:var(--text-secondary)]">{pillar.description}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
