import { describe, expect, it } from 'vitest'
import {
  DIAL_CY,
  DIAL_R,
  dialAngle,
  dialArcPath,
  dialAutoMax,
  dialCurve,
  dialMajorTicks,
  dialMinorTicks,
  dialPolar,
  dialScaleForPhase,
  dialTickLabel,
  fractionForGaugeScale,
  fractionForLatency,
  gaugeScaleForThroughput,
  gaugeScaleForThroughputPhase,
  gaugeScaleLabelPositions,
  gaugeScaleLabels,
  latencyGaugeLabelPositions,
  movingAverage,
} from './gaugeMath'

describe('dynamic throughput gauge scale', () => {
  it('selects the smallest available scale that fits the measurement', () => {
    expect(gaugeScaleForThroughput(9)).toBe(10)
    expect(gaugeScaleForThroughput(101)).toBe(250)
    expect(gaugeScaleForThroughput(1400)).toBe(2500)
  })

  it('never reduces the scale inside a measurement phase', () => {
    expect(gaugeScaleForThroughput(50, 500)).toBe(500)
  })

  it('resets to the smallest fitting scale when a new phase starts', () => {
    expect(gaugeScaleForThroughputPhase(9, 100, true)).toBe(10)
    expect(gaugeScaleForThroughputPhase(50, 500, true)).toBe(50)
    expect(gaugeScaleForThroughputPhase(50, 500, false)).toBe(500)
  })

  it('builds readable labels from the selected scale', () => {
    expect(gaugeScaleLabels(1000)).toEqual(['0', '100', '250', '500', '750', '1000'])
  })

  it('positions each throughput label at the same fraction used by its value', () => {
    expect(gaugeScaleLabelPositions(100)).toEqual([
      { text: '0', fraction: 0 },
      { text: '10', fraction: 0.1 },
      { text: '25', fraction: 0.25 },
      { text: '50', fraction: 0.5 },
      { text: '75', fraction: 0.75 },
      { text: '100', fraction: 1 },
    ])
  })

  it('keeps latency labels aligned with the inverted latency needle', () => {
    expect(latencyGaugeLabelPositions()).toEqual([150, 100, 75, 50, 25, 0].map((value) => ({
      text: `${value}`,
      fraction: fractionForLatency(value),
    })))
  })

  it('keeps the needle position faithful to the displayed scale', () => {
    expect(fractionForGaugeScale(100, 100)).toBe(1)
    expect(fractionForGaugeScale(1400, 2500)).toBe(0.56)
  })

  it('smooths only the visual samples with a moving average', () => {
    expect(movingAverage([20])).toBe(20)
    expect(movingAverage([20, 60, 40, 80])).toBe(50)
  })
})

describe('geometria do mostrador do protótipo', () => {
  it('curva o arco com expoente 0.78 e satura nos extremos', () => {
    expect(dialCurve(0)).toBe(0)
    expect(dialCurve(1)).toBe(1)
    expect(dialCurve(2)).toBe(1)
    expect(dialCurve(-1)).toBe(0)
    // Mais resolução na parte baixa da escala: metade do valor passa de
    // metade do arco.
    expect(dialCurve(0.5)).toBeGreaterThan(0.5)
  })

  it('varre 196° a partir de 188°, começando e terminando abaixo da horizontal', () => {
    expect(dialAngle(0)).toBe(188)
    expect(dialAngle(1)).toBe(-8)
    const start = dialPolar(dialAngle(0), DIAL_R)
    const end = dialPolar(dialAngle(1), DIAL_R)
    expect(start.y).toBeGreaterThan(DIAL_CY)
    expect(end.y).toBeGreaterThan(DIAL_CY)
    expect(start.x).toBeLessThan(end.x)
  })

  it('desenha o arco como um único comando A, sem large-arc dentro da varredura', () => {
    expect(dialArcPath(0, 1)).toMatch(/^M [\d.-]+ [\d.-]+ A 125 125 0 1 1 [\d.-]+ [\d.-]+$/)
    expect(dialArcPath(0, 0.2)).toMatch(/A 125 125 0 0 1/)
  })

  it('escolhe a menor escala que comporta a leitura, por unidade', () => {
    expect(dialAutoMax(9, 'Mbps')).toBe(10)
    expect(dialAutoMax(101, 'Mbps')).toBe(250)
    expect(dialAutoMax(9000, 'Mbps')).toBe(5000)
    expect(dialAutoMax(15, 'ms')).toBe(20)
    expect(dialAutoMax(400, 'ms')).toBe(200)
  })

  it('não deixa a escala encolher dentro da mesma fase, mas reinicia na fase seguinte', () => {
    expect(dialScaleForPhase(20, 'Mbps', 500, false)).toBe(500)
    expect(dialScaleForPhase(20, 'Mbps', 500, true)).toBe(50)
  })

  it('rotula traços maiores de forma curta e coerente com a escala', () => {
    expect(dialTickLabel(750)).toBe('750')
    expect(dialTickLabel(1000)).toBe('1k')
    expect(dialTickLabel(2500)).toBe('2.5k')
    expect(dialMajorTicks(1000, 14).map((tick) => tick.label)).toEqual(['0', '100', '250', '500', '750', '1k'])
  })

  it('não desenha traço menor por cima de um traço maior', () => {
    const majors = dialMajorTicks(100, 14)
    const minors = dialMinorTicks(100, 14)
    for (const minor of minors) {
      for (const major of majors) {
        expect(Math.hypot(minor.x1 - major.x1, minor.y1 - major.y1)).toBeGreaterThan(0.5)
      }
    }
  })
})
