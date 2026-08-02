import { describe, expect, it } from 'vitest'

import type { ChargerSourceCollection, CipSourceCollection } from './types'
import { normalizeChargers, normalizeProjects } from './normalize'

const makeProjectFeature = (overrides: Record<string, unknown> = {}) => ({
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
    PROJECTID: 77,
    ProjectTitle: 'Sample',
    ProgramName: 'Program',
    CurrentPhaseDescription: null,
    CurrentPhasePercentComplete: null,
    ConstructionCost: null,
    CouncilDistrict: null,
    PM_Name: null,
    PM_EMail: null,
    ConsStartDate: null,
    ConsEndDate: null,
    ...overrides,
  },
})

const makeChargerFeature = (overrides: { geometry?: unknown; properties?: Record<string, unknown> } = {}) => ({
  type: 'Feature',
  geometry: overrides.geometry ?? {
    type: 'Point',
    coordinates: [-118.3, 34.02],
  },
  properties: {
    OBJECTID: 1,
    slid: null,
    lat: null,
    lon: null,
    Date_Imported: null,
    TOOLTIP: null,
    NLA_URL: null,
    ...overrides.properties,
  },
})

describe('normalizeProjects', () => {
  it('returns validated projects for minimal valid input', () => {
    const data: CipSourceCollection = {
      type: 'FeatureCollection',
      features: [makeProjectFeature() as never],
    }

    const projects = normalizeProjects(data)

    expect(projects).toHaveLength(1)
    expect(projects[0]?.properties.OBJECTID).toBe(1)
    expect(projects[0]?.geometry.type).toBe('Polygon')
  })

  it('throws when features is not an array', () => {
    const data = {
      type: 'FeatureCollection',
      features: {},
    } as unknown as CipSourceCollection

    expect(() => normalizeProjects(data)).toThrow(/features/i)
  })

  it('throws when a project feature has a missing or non-numeric OBJECTID', () => {
    const data: CipSourceCollection = {
      type: 'FeatureCollection',
      features: [makeProjectFeature({ OBJECTID: 'bad' }) as never],
    }

    expect(() => normalizeProjects(data)).toThrow(/OBJECTID/i)
  })

  it('throws when a project feature has an invalid geometry type', () => {
    const data: CipSourceCollection = {
      type: 'FeatureCollection',
      features: [{
        ...makeProjectFeature(),
        geometry: { type: 'LineString', coordinates: [] },
      }] as never,
    }

    expect(() => normalizeProjects(data)).toThrow(/geometry/i)
  })
})

describe('normalizeChargers', () => {
  it('returns validated chargers for minimal valid input', () => {
    const data: ChargerSourceCollection = {
      type: 'FeatureCollection',
      features: [makeChargerFeature() as never],
    }

    const chargers = normalizeChargers(data)

    expect(chargers).toHaveLength(1)
    expect(chargers[0]).toEqual({ id: 1, position: [-118.3, 34.02] })
  })

  it('throws when a charger feature has malformed coordinates', () => {
    const data: ChargerSourceCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [1, 2, 3] },
        properties: {
          OBJECTID: 1,
          slid: null,
          lat: null,
          lon: null,
          Date_Imported: null,
          TOOLTIP: null,
          NLA_URL: null,
        },
      }] as never,
    }

    expect(() => normalizeChargers(data)).toThrow(/coordinates/i)
  })

  it('throws when a charger feature has non-numeric coordinates', () => {
    const data: ChargerSourceCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: ['x', 2] },
        properties: {
          OBJECTID: 1,
          slid: null,
          lat: null,
          lon: null,
          Date_Imported: null,
          TOOLTIP: null,
          NLA_URL: null,
        },
      }] as never,
    }

    expect(() => normalizeChargers(data)).toThrow(/coordinates/i)
  })
})
