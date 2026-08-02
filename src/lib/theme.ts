// These values must be kept in sync with the :root custom properties in index.css.
// This is a plain values file for Leaflet pathOptions, not a CSS-in-JS abstraction.
export const COLORS = {
  accent: '#185fa5',
  accentSoft: '#e6f1fb',
  inkFaint: '#8f8e88',
  inkSoft: '#63625d',
  line: '#e2e0d9',
  inside: '#0f6e56',
} as const

export const MAP_CENTER: [number, number] = [34.02, -118.35]

export const BUFFER_RING_STYLE = {
  color: COLORS.inside,
  weight: 2,
  fill: false,
  dashArray: '5 5',
} as const

export function CHARGER_TOOLTIP_LABEL(chargerId: number): string {
  return `Charger ${chargerId} — no attribute data in the source file`
}
