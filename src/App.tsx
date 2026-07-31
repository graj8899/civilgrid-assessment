import { useEffect, useMemo, useState } from 'react'

import MapView from './MapView'
import ProjectList from './ProjectList'
import { buildMatches } from './spatial'
import type { Charger, ChargerSourceCollection, CipSourceCollection, Project, SortKey } from './types'

const projectsUrl = `${import.meta.env.BASE_URL}data/cip_projects.json`
const chargersUrl = `${import.meta.env.BASE_URL}data/ev_chargers.json`
const RADIUS_STOPS = [0, 250, 500, 1000]

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [chargers, setChargers] = useState<Charger[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [radiusIndex, setRadiusIndex] = useState<number>(() => RADIUS_STOPS.indexOf(500))
  const [sortKey, setSortKey] = useState<SortKey>('chargerCount')
  const radiusMeters = RADIUS_STOPS[radiusIndex] ?? 0

  const matches = useMemo(
    () => buildMatches(projects, chargers, radiusMeters),
    [projects, chargers, radiusMeters],
  )

  const sorted = useMemo(() => {
    const nextProjects = [...projects]

    nextProjects.sort((left, right) => {
      const leftMatch = matches.get(left.properties.OBJECTID)
      const rightMatch = matches.get(right.properties.OBJECTID)
      const leftTotal = (leftMatch?.inside.length ?? 0) + (leftMatch?.nearby.length ?? 0)
      const rightTotal = (rightMatch?.inside.length ?? 0) + (rightMatch?.nearby.length ?? 0)

      if (sortKey === 'chargerCount') {
        return rightTotal - leftTotal
      }

      if (sortKey === 'constructionStart') {
        const leftDate = left.properties.ConsStartDate ?? Number.POSITIVE_INFINITY
        const rightDate = right.properties.ConsStartDate ?? Number.POSITIVE_INFINITY
        return leftDate - rightDate
      }

      const leftCost = left.properties.ConstructionCost ?? Number.NEGATIVE_INFINITY
      const rightCost = right.properties.ConstructionCost ?? Number.NEGATIVE_INFINITY
      return rightCost - leftCost
    })

    return nextProjects
  }, [projects, matches, sortKey])

  const selectedProject = projects.find((project) => project.properties.OBJECTID === selectedId) ?? null
  const selectedMatch = selectedId != null ? matches.get(selectedId) ?? null : null

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        const [projectsResponse, chargersResponse] = await Promise.all([
          fetch(projectsUrl),
          fetch(chargersUrl),
        ])

        if (!projectsResponse.ok || !chargersResponse.ok) {
          throw new Error('Failed to load project and charger data')
        }

        const [projectsData, chargersData]: [CipSourceCollection, ChargerSourceCollection] = await Promise.all([
          projectsResponse.json(),
          chargersResponse.json(),
        ])

        if (cancelled) {
          return
        }

        const normalizedProjects = projectsData.features as Project[]
        const normalizedChargers = chargersData.features.map((feature) => {
          const [lon, lat] = feature.geometry.coordinates as [number, number]
          return {
            id: feature.properties.OBJECTID,
            position: [lon, lat] as [number, number],
          }
        })

        setProjects(normalizedProjects)
        setChargers(normalizedChargers)
        setStatus('ready')
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return <p>Loading data…</p>
  }

  if (status === 'error') {
    return (
      <p>
        Error loading data from {projectsUrl} and {chargersUrl}
      </p>
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <strong>CIP × EV charger synergy finder</strong>
        <span>{projects.length} projects · {chargers.length} chargers</span>
        <label htmlFor="radius-slider" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Proximity radius</span>
          <input
            id="radius-slider"
            type="range"
            min="0"
            max={RADIUS_STOPS.length - 1}
            step="1"
            value={radiusIndex}
            onChange={(event) => setRadiusIndex(Number(event.target.value))}
          />
          <span>{radiusMeters === 0 ? 'footprint' : `${radiusMeters} m`}</span>
        </label>
        <label htmlFor="sort-select" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Sort</span>
          <select id="sort-select" value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="chargerCount">charger count</option>
            <option value="constructionStart">construction start</option>
            <option value="constructionCost">construction cost</option>
          </select>
        </label>
      </div>
      <div className="main">
        <aside className="sidebar">
          <ProjectList
            projects={sorted}
            matches={matches}
            selectedId={selectedId}
            radiusMeters={radiusMeters}
            onSelect={setSelectedId}
          />
        </aside>
        <div className="map">
          <MapView
            projects={projects}
            chargers={chargers}
            selectedId={selectedId}
            selectedProject={selectedProject}
            selectedMatch={selectedMatch}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  )
}

export default App
