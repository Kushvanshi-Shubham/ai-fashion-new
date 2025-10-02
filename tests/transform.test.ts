import { describe, it, expect } from 'vitest'
import { normalizeExtraction } from '@/lib/extraction/transform'
import { isCompletedExtraction } from '@/types/fashion'

describe('normalizeExtraction', () => {
  it('maps completed extraction with confidence scaling', () => {
  const r = normalizeExtraction({ id: '1', status: 'completed', confidence: 0.85, attributes: { color_main: { value: 'RED' } }, tokensUsed: 120 }, 'file.jpg')
  if (!isCompletedExtraction(r)) throw new Error('Expected completed result')
  expect(r.confidence).toBe(85)
  expect(r.tokensUsed).toBe(120)
  expect(r.attributes.color_main).toBeDefined()
  expect(r.attributes.color_main!.value).toBe('RED')
  })

  it('maps failed extraction', () => {
    const r = normalizeExtraction({ status: 'failed', error: 'Boom' }, 'f.png')
    expect(r.status).toBe('failed')
  if (r.status !== 'failed') throw new Error('Expected failed result')
  expect(r.error).toBe('Boom')
  })

  it('handles pending status', () => {
    const r = normalizeExtraction({ status: 'processing' }, 'x.png')
    expect(r.status).toBe('processing')
  })
})
