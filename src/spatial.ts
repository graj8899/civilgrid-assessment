import bbox from '@turf/bbox'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import buffer from '@turf/buffer'

import type { Charger, CipGeometry, Project, ProjectMatch } from './types'

const toLonLat = (position: [number, number]) => ({ type: 'Point' as const, coordinates: position })

export function chargersInGeometry(geometry: CipGeometry, chargers: Charger[]): number[] {
  return chargers
    .filter((charger) => booleanPointInPolygon(toLonLat(charger.position), geometry))
    .map((charger) => charger.id)
}

export function bufferGeometry(geometry: CipGeometry, radiusMeters: number): CipGeometry | null {
  if (radiusMeters <= 0) {
    return null
  }

  const buffered = buffer(geometry, radiusMeters, { units: 'meters' }) as
    | { type: string; geometry?: CipGeometry }
    | null

  if (!buffered) {
    return null
  }

  if (buffered.type === 'Feature') {
    return buffered.geometry ?? null
  }

  if (buffered.type === 'FeatureCollection' || buffered.type === 'GeometryCollection') {
    return null
  }

  return buffered as CipGeometry
}

export function matchProject(
  project: Project,
  chargers: Charger[],
  radiusMeters: number,
): ProjectMatch {
  const inside = chargersInGeometry(project.geometry, chargers)
  const insideSet = new Set(inside)
  const bufferedGeometry = bufferGeometry(project.geometry, radiusMeters)

  const nearby = chargers
    .filter((charger) => !insideSet.has(charger.id))
    .filter((charger) => {
      if (!bufferedGeometry) {
        return false
      }
      return booleanPointInPolygon(toLonLat(charger.position), bufferedGeometry)
    })
    .map((charger) => charger.id)

  return {
    projectId: project.properties.PROJECTID,
    inside,
    nearby,
    total: inside.length + nearby.length,
    bufferGeometry: bufferedGeometry,
  }
}

export function buildMatches(
  projects: Project[],
  chargers: Charger[],
  radiusMeters: number,
): Map<number, ProjectMatch> {
  return new Map(
    projects.map((project) => [project.properties.PROJECTID, matchProject(project, chargers, radiusMeters)]),
  )
}

export function boundsOf(geometry: CipGeometry): [number, number, number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox(geometry)
  return [minLon, minLat, maxLon, maxLat]
}
