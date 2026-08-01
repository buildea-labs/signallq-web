import { describe, expect, it } from 'vitest'
import { fractionForGaugeScale, fractionForLatency, gaugeScaleForThroughput, gaugeScaleForThroughputPhase, gaugeScaleLabelPositions, gaugeScaleLabels, latencyGaugeLabelPositions, movingAverage } from './gaugeMath'

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
