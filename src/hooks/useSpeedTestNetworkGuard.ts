// Guarda de rede da medição: captura ativa do estado de rede antes de medir e
// detecção de contaminação por troca de rede (Wi-Fi -> celular, por exemplo)
// entre o início e o fim do teste. Uma medição que atravessou duas redes não
// mede nenhuma das duas — por isso vira 'contaminated'/parcial, não resultado.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEstadoRede, type EstadoRede } from './useEstadoRede'
import type { TipoRede } from '../lib/connection'

export interface SpeedTestNetworkGuard {
  // Tipo de rede detectado no início do teste (wifi/celular/ethernet) — usado
  // no chip da tela de Resultado e salvo no registro do Histórico. Distinto
  // de `result.connectionType` (effectiveType da Network Information API).
  connectionKind: TipoRede | null
  capturarRedeInicial: () => Promise<EstadoRede>
  redeMudouDuranteOTeste: () => Promise<boolean>
}

export function useSpeedTestNetworkGuard(onNetworkChange: () => void): SpeedTestNetworkGuard {
  const [connectionKind, setConnectionKind] = useState<TipoRede | null>(null)
  const connectionKindRef = useRef<TipoRede | null>(null)

  const { revalidarAgora } = useEstadoRede()
  const revalidarAgoraRef = useRef(revalidarAgora)
  useEffect(() => {
    revalidarAgoraRef.current = revalidarAgora
  }, [revalidarAgora])

  const onNetworkChangeRef = useRef(onNetworkChange)
  useEffect(() => {
    onNetworkChangeRef.current = onNetworkChange
  }, [onNetworkChange])

  // Checagem ativa antes de medir: navigator.onLine sozinho não detecta
  // Wi-Fi conectado sem internet real (ex.: portal cativo) — evita esperar
  // o motor de medição falhar por timeout pra só então mostrar a mensagem
  // de "sem conexão". Aproveitada também para capturar o tipo de rede
  // (wifi/celular/ethernet) exibido no resultado e salvo no histórico.
  const capturarRedeInicial = useCallback(async (): Promise<EstadoRede> => {
    const rede = await revalidarAgoraRef.current()
    connectionKindRef.current = rede.tipo
    setConnectionKind(rede.tipo)
    return rede
  }, [])

  const redeMudouDuranteOTeste = useCallback(async (): Promise<boolean> => {
    const redeFinal = await revalidarAgoraRef.current()
    return (
      connectionKindRef.current !== 'desconhecida' &&
      redeFinal.tipo !== 'desconhecida' &&
      connectionKindRef.current !== redeFinal.tipo
    )
  }, [])

  useEffect(() => {
    const handler = () => onNetworkChangeRef.current()
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])

  return { connectionKind, capturarRedeInicial, redeMudouDuranteOTeste }
}
