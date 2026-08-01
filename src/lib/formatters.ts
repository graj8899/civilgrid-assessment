import type { Project } from './types'

export function formatDate(epochMs: number | null): string {
  if (epochMs == null) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(epochMs)
}

export function formatCost(value: number | null): string {
  if (value == null || value === 0) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDistricts(raw: string | null): string {
  if (!raw) {
    return '—'
  }

  const districts = raw
    .split(',')
    .map((district) => district.trim())
    .filter(Boolean)

  return districts.length > 0 ? districts.join(', ') : '—'
}

export function formatPhase(project: Project): string {
  const phase = project.properties.CurrentPhaseDescription?.trim()
  const percent = project.properties.CurrentPhasePercentComplete

  if (phase && percent != null) {
    return `${phase} — ${percent}%`
  }

  if (phase) {
    return phase
  }

  if (percent != null) {
    return `${percent}%`
  }

  return '—'
}

export function formatRadiusLabel(radiusMeters: number): string {
  return radiusMeters > 0 ? `within ${radiusMeters} m` : 'inside'
}

export function formatMatchSummary(insideCount: number, nearbyCount: number, radiusMeters: number): string {
  if (insideCount === 0 && nearbyCount === 0) {
    return 'No chargers matched'
  }

  if (radiusMeters > 0) {
    return `${insideCount} inside footprint · ${nearbyCount} ${formatRadiusLabel(radiusMeters)}`
  }

  return `${insideCount} inside footprint`
}
