import { describe, expect, it } from 'vitest'

import { getChargerStatus } from './chargerStatus'
import type { ProjectMatch } from './types'

const match: ProjectMatch = {
  projectId: 7,
  inside: [101],
  nearby: [102],
  total: 2,
  bufferGeometry: null,
}

describe('getChargerStatus', () => {
  it('returns inside when the charger is in the footprint', () => {
    expect(getChargerStatus(101, match)).toBe('inside')
  })

  it('returns nearby when the charger is only in the ring', () => {
    expect(getChargerStatus(102, match)).toBe('nearby')
  })

  it('returns unmatched when the charger is outside both buckets', () => {
    expect(getChargerStatus(103, match)).toBe('unmatched')
  })

  it('falls back to unmatched for a null match', () => {
    expect(getChargerStatus(101, null)).toBe('unmatched')
  })
})
