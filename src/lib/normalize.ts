import type { Charger, ChargerSourceCollection, CipSourceCollection, Project } from './types'

function describeFeature(feature: unknown, index: number): string {
  if (feature && typeof feature === 'object' && 'properties' in feature && feature.properties && typeof feature.properties === 'object') {
    const objectId = 'OBJECTID' in feature.properties ? feature.properties.OBJECTID : undefined
    if (typeof objectId === 'number') {
      return `feature ${objectId}`
    }
  }

  return `feature at index ${index}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function normalizeProjects(data: CipSourceCollection): Project[] {
  if (!Array.isArray(data.features)) {
    throw new Error('Invalid project data: features must be an array')
  }

  return data.features.map((feature, index) => {
    if (!isRecord(feature)) {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} is not an object`)
    }

    const properties = feature.properties
    if (!isRecord(properties)) {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} is missing properties`)
    }

    const objectId = properties.OBJECTID
    if (!isFiniteNumber(objectId)) {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} has a missing or invalid OBJECTID`)
    }

    if (!('PROJECTID' in properties)) {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} is missing PROJECTID`)
    }

    const geometry = feature.geometry
    if (!isRecord(geometry)) {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} is missing geometry`)
    }

    const geometryType = geometry.type
    if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
      throw new Error(`Invalid project data: ${describeFeature(feature, index)} has invalid geometry.type ${String(geometryType)}`)
    }

    return feature as Project
  })
}

export function normalizeChargers(data: ChargerSourceCollection): Charger[] {
  if (!Array.isArray(data.features)) {
    throw new Error('Invalid charger data: features must be an array')
  }

  return data.features.map((feature, index) => {
    if (!isRecord(feature)) {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} is not an object`)
    }

    const properties = feature.properties
    if (!isRecord(properties)) {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} is missing properties`)
    }

    const objectId = properties.OBJECTID
    if (!isFiniteNumber(objectId)) {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} has a missing or invalid OBJECTID`)
    }

    const geometry = feature.geometry
    if (!isRecord(geometry)) {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} is missing geometry`)
    }

    const geometryType = geometry.type
    if (geometryType !== 'Point') {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} has invalid geometry.type ${String(geometryType)}`)
    }

    const coordinates = geometry.coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2 || !isFiniteNumber(coordinates[0]) || !isFiniteNumber(coordinates[1])) {
      throw new Error(`Invalid charger data: ${describeFeature(feature, index)} has invalid coordinates`)
    }

    return {
      id: objectId,
      position: [coordinates[0], coordinates[1]] as [number, number],
    }
  })
}
