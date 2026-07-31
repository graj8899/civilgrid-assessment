import { useEffect, useState } from 'react'

import MapView from './MapView'
import type { Charger, ChargerSourceCollection, CipSourceCollection, Project } from './types'

const projectsUrl = `${import.meta.env.BASE_URL}data/cip_projects.json`
const chargersUrl = `${import.meta.env.BASE_URL}data/ev_chargers.json`

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [chargers, setChargers] = useState<Charger[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

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
      </div>
      <div className="main">
        <aside className="sidebar">
          <div className="status">Select a project to inspect matches.</div>
        </aside>
        <div className="map">
          <MapView projects={projects} chargers={chargers} />
        </div>
      </div>
    </div>
  )
}

export default App
