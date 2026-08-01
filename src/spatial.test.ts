import { describe, expect, it } from 'vitest'

import type { Charger, CipGeometry, Project } from './types'
import {
  boundsOf,
  buildMatches,
  bufferGeometry,
  chargersInGeometry,
  matchProject,
} from './spatial'

const squareGeometry: CipGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-118.3, 34.02],
      [-118.29, 34.02],
      [-118.29, 34.03],
      [-118.3, 34.03],
      [-118.3, 34.02],
    ],
  ],
}

const multipolygonGeometry: CipGeometry = {
  type: 'MultiPolygon',
  coordinates: [
    [
      [
        [-118.3, 34.02],
        [-118.29, 34.02],
        [-118.29, 34.03],
        [-118.3, 34.03],
        [-118.3, 34.02],
      ],
    ],
    [
      [
        [-118.284, 34.022],
        [-118.283, 34.022],
        [-118.283, 34.023],
        [-118.284, 34.023],
        [-118.284, 34.022],
      ],
    ],
  ],
}

const makeProject = (geometry: CipGeometry, projectId: number): Project => ({
  type: 'Feature',
  geometry,
  properties: {
    OBJECTID: projectId,
    PROJECTID: projectId,
    ProjectTitle: `Project ${projectId}`,
    ProgramName: 'Program',
    CurrentPhaseDescription: null,
    CurrentPhasePercentComplete: null,
    ConstructionCost: null,
    CouncilDistrict: null,
    PM_Name: null,
    PM_EMail: null,
    ConsStartDate: null,
    ConsEndDate: null,
  },
})

const makeChargers = (): Charger[] => [
  { id: 101, position: [-118.295, 34.025] },
  { id: 102, position: [-118.288917, 34.025] },
  { id: 103, position: [-118.28025, 34.025] },
  { id: 104, position: [-118.25, 34.025] },
  { id: 105, position: [-118.2835, 34.0225] },
]

describe('chargersInGeometry', () => {
  it('returns matching ids, not indices', () => {
    const ids = chargersInGeometry(squareGeometry, makeChargers())

    expect(ids).toEqual([101])
  })

  it('returns an empty array for empty input', () => {
    expect(chargersInGeometry(squareGeometry, [])).toEqual([])
  })

  it('finds a point in the second polygon of a MultiPolygon', () => {
    const ids = chargersInGeometry(multipolygonGeometry, makeChargers())

    expect(ids).toEqual([101, 105])
  })
})

describe('bufferGeometry', () => {
  it('returns null at radius 0 and at negative radius', () => {
    expect(bufferGeometry(squareGeometry, 0)).toBeNull()
    expect(bufferGeometry(squareGeometry, -10)).toBeNull()
  })

  it('grows the bbox in all four directions for a positive radius', () => {
    const originalBounds = boundsOf(squareGeometry)
    const buffered = bufferGeometry(squareGeometry, 250)

    expect(buffered).not.toBeNull()
    const bufferedBounds = boundsOf(buffered!)

    expect(bufferedBounds[0]).toBeLessThan(originalBounds[0])
    expect(bufferedBounds[1]).toBeLessThan(originalBounds[1])
    expect(bufferedBounds[2]).toBeGreaterThan(originalBounds[2])
    expect(bufferedBounds[3]).toBeGreaterThan(originalBounds[3])
  })
})

describe('matchProject', () => {
  it('uses strict containment at radius 0 and keeps the buckets disjoint', () => {
    const result = matchProject(makeProject(squareGeometry, 7), makeChargers(), 0)

    expect(result.inside).toEqual([101])
    expect(result.nearby).toEqual([])
    expect(result.total).toBe(1)
    expect(result.bufferGeometry).toBeNull()
  })

  it('places a ~100 m point in nearby and excludes it from inside', () => {
    const result = matchProject(makeProject(squareGeometry, 7), makeChargers(), 250)

    expect(result.inside).toEqual([101])
    expect(result.nearby).toEqual([102])
    expect(result.total).toBe(2)
    expect(result.bufferGeometry).not.toBeNull()
  })

  it('excludes the 900 m and remote chargers from a 250 m buffer', () => {
    const result = matchProject(makeProject(squareGeometry, 7), makeChargers(), 250)

    expect(result.nearby).not.toContain(103)
    expect(result.nearby).not.toContain(104)
  })

  it('is monotonic in radius and uses the project OBJECTID', () => {
    const project = makeProject(squareGeometry, 55)
    const radius0 = matchProject(project, makeChargers(), 0)
    const radius250 = matchProject(project, makeChargers(), 250)
    const radius1000 = matchProject(project, makeChargers(), 1000)

    expect(radius0.total).toBeLessThan(radius250.total)
    expect(radius250.total).toBeLessThan(radius1000.total)
    expect(radius250.projectId).toBe(55)
  })
})

describe('buildMatches', () => {
  it('keys the map by OBJECTID and includes zero-match projects', () => {
    const firstProject = makeProject(squareGeometry, 11)
    const secondProject = makeProject(
      {
        type: 'Polygon',
        coordinates: [[
          [-118.25, 34.01],
          [-118.24, 34.01],
          [-118.24, 34.02],
          [-118.25, 34.02],
          [-118.25, 34.01],
        ]],
      },
      12,
    )
    const matches = buildMatches([firstProject, secondProject], makeChargers(), 250)

    expect(matches.has(11)).toBe(true)
    expect(matches.has(12)).toBe(true)

    const zeroMatch = matches.get(12)
    expect(zeroMatch).toBeDefined()
    expect(zeroMatch!.inside).toEqual([])
    expect(zeroMatch!.nearby).toEqual([])
  })

  it('keeps projects with the same PROJECTID as separate entries when their OBJECTIDs differ', () => {
    const firstProject = makeProject(squareGeometry, 201)
    const secondProject = makeProject(
      {
        type: 'Polygon',
        coordinates: [[
          [-118.25, 34.01],
          [-118.24, 34.01],
          [-118.24, 34.02],
          [-118.25, 34.02],
          [-118.25, 34.01],
        ]],
      },
      202,
    )

    firstProject.properties.PROJECTID = 99
    secondProject.properties.PROJECTID = 99

    const matches = buildMatches([firstProject, secondProject], makeChargers(), 250)

    expect(matches.size).toBe(2)
    expect(matches.has(201)).toBe(true)
    expect(matches.has(202)).toBe(true)
  })

  it('returns an empty map for an empty project list', () => {
    expect(buildMatches([], makeChargers(), 250).size).toBe(0)
  })
})

describe('boundsOf', () => {
  it('returns [minLon, minLat, maxLon, maxLat] and spans both lobes', () => {
    const bounds = boundsOf(multipolygonGeometry)

    expect(bounds).toEqual([-118.3, 34.02, -118.283, 34.03])
  })
})
