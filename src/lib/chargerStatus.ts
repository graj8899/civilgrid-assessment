import type { ProjectMatch } from './types'

export function getChargerStatus(chargerId: number, match: ProjectMatch | null): 'inside' | 'nearby' | 'unmatched' {
  if (match?.inside.includes(chargerId)) {
    return 'inside'
  }

  if (match?.nearby.includes(chargerId)) {
    return 'nearby'
  }

  return 'unmatched'
}
