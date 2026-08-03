import { formatarDataHora, formatarDuracao } from "../../lib/measurementFormat";
import type { SpeedTestResult } from "../../lib/speedEngine";
import { BUFFERBLOAT_LABEL, MODE_LABEL } from "./homeCopy";

/**
 * Monta os 3 grupos do bloco único "Ver detalhes do teste" (#70), decidindo
 * quais linhas aparecem a partir do que foi de fato medido — nunca preenche
 * ausência com zero (regra da spec de UX #70 §2.5). Função pura para permitir
 * teste sem infraestrutura de render de componente (não existe no repo).
 */

export interface DetailRow {
  id: string;
  label: string;
  value: string;
  /** Frase única de ajuda contextual; presente só nos termos que um leigo não reconhece. */
  help?: string;
}

export interface DetailGroup {
  title: string;
  rows: DetailRow[];
}

function estabilidadeNivel(score: number): string {
  if (score >= 90) return "Alta";
  if (score >= 75) return "Média";
  return "Baixa";
}

export function buildTechnicalDetailGroups(result: SpeedTestResult): DetailGroup[] {
  const velocidade: DetailRow[] = [
    { id: "download", label: "Download", value: `${result.download.mbps.toFixed(1)} Mbps` },
  ];
  // Upload não é medido no modo Rápido: omitir por `mode`, nunca pelo valor
  // numérico (um 0.0 real de modo Completo é dado válido; em modo Rápido é
  // placeholder do motor de medição).
  if (result.mode !== "rapido") {
    velocidade.push({ id: "upload", label: "Upload", value: `${result.upload.mbps.toFixed(1)} Mbps` });
  }

  const respostaDaConexao: DetailRow[] = [
    { id: "latencia", label: "Latência", value: `${Math.round(result.latency.ms)} ms` },
  ];
  // `jitter === null` já é o sinal oficial de "amostras insuficientes" —
  // a linha inteira some, sem substituir por 0 ou "—".
  if (result.jitter) {
    respostaDaConexao.push({
      id: "jitter",
      label: "Jitter",
      value: `${result.jitter.ms.toFixed(1)} ms`,
      help: "Variação da latência entre as amostras: quanto menor, mais estável a resposta da conexão.",
    });
  }
  respostaDaConexao.push({
    id: "latenciaSobCarga",
    label: "Latência sob carga",
    value: `${result.bufferbloat.ms.toFixed(1)} ms · ${BUFFERBLOAT_LABEL[result.bufferbloat.severity]}`,
    help: "Também chamada de bufferbloat: quanto a latência piora quando a conexão está ocupada baixando ou enviando dados.",
  });
  // Perda de pacotes: 0% é uma medição real (ausência de timeout) sempre que
  // houve amostra de latência — não é placeholder, não se omite por ser zero.
  if (result.latency.validSamples > 0) {
    respostaDaConexao.push({
      id: "perdaDePacotes",
      label: "Perda de pacotes",
      value: `${result.packetLoss.percent.toFixed(1)}%`,
    });
  }
  respostaDaConexao.push({
    id: "estabilidade",
    label: "Estabilidade",
    value: `${result.stabilityScore.toFixed(0)}% · ${estabilidadeNivel(result.stabilityScore)}`,
    help: "Indica quão constante sua conexão se manteve durante o teste.",
  });

  const sobreOTeste: DetailRow[] = [
    { id: "modo", label: "Modo", value: MODE_LABEL[result.mode] },
    { id: "horario", label: "Horário", value: formatarDataHora(result.timestamp) },
  ];
  if (result.durationMs != null) {
    sobreOTeste.push({ id: "duracao", label: "Duração", value: formatarDuracao(result.durationMs) });
  }
  sobreOTeste.push({ id: "servidor", label: "Servidor", value: result.server });
  if (result.dns.latencyMs != null) {
    sobreOTeste.push({
      id: "dns",
      label: "Resolução DNS",
      value: `${result.dns.latencyMs} ms`,
      help: "Tempo para traduzir o endereço do servidor de teste antes da medição começar.",
    });
  }

  return [
    { title: "Velocidade", rows: velocidade },
    { title: "Resposta da conexão", rows: respostaDaConexao },
    { title: "Sobre o teste", rows: sobreOTeste },
  ];
}
