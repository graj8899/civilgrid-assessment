import { describe, expect, it } from 'vitest'

import type { Project } from './types'
import {
  formatCost,
  formatDate,
  formatDistricts,
  formatPhase,
} from './ProjectList'

const makeProject = (overrides: Partial<Project['properties']> = {}): Project => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-118.3, 34.02],
      [-118.29, 34.02],
      [-118.29, 34.03],
      [-118.3, 34.03],
      [-118.3, 34.02],
    ]],
  },
  properties: {
    OBJECTID: 1,
    PROJECTID: 1,
    ProjectTitle: 'Sample',
    ProgramName: 'Program',
    CurrentPhaseDescription: 'Design',
    CurrentPhasePercentComplete: 75,
    ConstructionCost: 62700000,
    CouncilDistrict: '1, 2, 3',
    PM_Name: 'Jane Doe',
    PM_EMail: 'jane@example.com',
    ConsStartDate: 1704067200000,
    ConsEndDate: 1735689600000,
    ...overrides,
  },
})

describe('ProjectList formatters', () => {
  it('formats dates and costs with the requested fallback values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(1704067200000)).toContain('2024')
    expect(formatCost(null)).toBe('—')
    expect(formatCost(0)).toBe('—')
    expect(formatCost(62700000)).toBe('$62.7M')
  })

  it('formats council districts and phase summaries', () => {
    expect(formatDistricts(' 1 ,2, 3 ')).toBe('1, 2, 3')
    expect(formatPhase(makeProject())).toBe('Design — 75%')
    expect(formatPhase(makeProject({ CurrentPhaseDescription: null, CurrentPhasePercentComplete: null }))).toBe('—')
  })
})
