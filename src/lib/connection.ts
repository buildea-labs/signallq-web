// Vocabulário de tipo de conexão compartilhado entre o hook de estado de rede
// (hooks/useEstadoRede.ts) e o histórico local (lib/measurementRepository.ts) — vive em
// lib/ (não em hooks/) para não inverter a direção de dependência: lib/ não
// deve importar de hooks/.
export type TipoRede = 'wifi' | 'celular' | 'ethernet' | 'nenhuma' | 'desconhecida'

export function labelConexao(tipo: TipoRede | null | undefined): string {
  switch (tipo) {
    case 'wifi':
      return 'Wi-Fi'
    case 'celular':
      return 'Rede móvel'
    case 'ethernet':
      return 'Ethernet'
    default:
      return 'Conexão desconhecida'
  }
}

// Ícone Material Symbol por tipo. `settings_ethernet` representa Ethernet;
// antes só distinguia Wi-Fi
// do resto porque o filtro de Ethernet ainda não existia na UI.
export function iconeConexao(tipo: TipoRede | null | undefined): string {
  if (tipo === 'wifi') return 'wifi'
  if (tipo === 'ethernet') return 'settings_ethernet'
  return 'speed'
}
