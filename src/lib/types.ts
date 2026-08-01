import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson'

/**
 * The source CIP GeoJSON has 36 keys total, but this app only needs a curated subset.
 * Shape_Area and Shape_Length are in a projected CRS in US survey feet and must never be read as degrees.
 * StartDate/EndDate duplicate ConsStartDate/ConsEndDate; use the Cons* fields.
 * All date fields are epoch milliseconds.
 */
export interface CipProps {
  OBJECTID: number
  PROJECTID: number
  ProjectTitle: string
  ProgramName: string
  CurrentPhaseDescription: string | null
  CurrentPhasePercentComplete: number | null
  ConstructionCost: number | null
  CouncilDistrict: string | null
  PM_Name: string | null
  PM_EMail: string | null
  ConsStartDate: number | null
  ConsEndDate: number | null
}

export type CipGeometry = Polygon | MultiPolygon

/** Project is the GeoJSON feature itself; no separate domain model is introduced. */
export type Project = Feature<CipGeometry, CipProps>

export type CipSourceCollection = FeatureCollection<CipGeometry, CipProps>

export interface ChargerSourceProps {
  OBJECTID: number
  slid: null
  lat: null
  lon: null
  Date_Imported: null
  TOOLTIP: null
  NLA_URL: null
}

export type ChargerSourceCollection = FeatureCollection<Point, ChargerSourceProps>

export interface Charger {
  /** All 414 charger features have null attributes besides OBJECTID, so this is everything available. */
  id: number
  position: [number, number]
}

export interface ProjectMatch {
  /** Unique per feature/geometry and sourced from OBJECTID; PROJECTID can repeat across segments of one program. */
  projectId: number
  inside: number[]
  nearby: number[]
  total: number
  bufferGeometry: CipGeometry | null
}

export type SortKey = 'chargerCount' | 'constructionStart' | 'constructionCost'
