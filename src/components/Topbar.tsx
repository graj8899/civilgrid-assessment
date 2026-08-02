import type { SortKey } from '../lib/types'

interface TopbarProps {
  projectCount: number
  chargerCount: number
  radiusIndex: number
  radiusMeters: number
  radiusStops: number[]
  sortKey: SortKey
  onRadiusChange: (value: number) => void
  onSortChange: (value: SortKey) => void
}

function Topbar({
  projectCount,
  chargerCount,
  radiusIndex,
  radiusMeters,
  radiusStops,
  sortKey,
  onRadiusChange,
  onSortChange,
}: TopbarProps) {
  return (
    <div className="topbar">
      <strong>CIP × EV charger synergy finder</strong>
      <span>{projectCount} projects · {chargerCount} chargers</span>
      <label htmlFor="radius-slider" className="topbar-field">
        <span>Proximity radius</span>
        <input
          id="radius-slider"
          type="range"
          min="0"
          max={radiusStops.length - 1}
          step="1"
          value={radiusIndex}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
        />
        <span>{radiusMeters === 0 ? 'footprint' : `${radiusMeters} m`}</span>
      </label>
      <label htmlFor="sort-select" className="topbar-field">
        <span>Sort</span>
        <select id="sort-select" value={sortKey} onChange={(event) => onSortChange(event.target.value as SortKey)}>
          <option value="chargerCount">charger count</option>
          <option value="constructionStart">construction start</option>
          <option value="constructionCost">construction cost</option>
        </select>
      </label>
    </div>
  )
}

export default Topbar
