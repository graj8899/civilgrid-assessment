import { CircleMarker, GeoJSON, MapContainer, TileLayer } from 'react-leaflet'

import type { Charger, Project } from './types'

interface MapViewProps {
  projects: Project[]
  chargers: Charger[]
}

const center: [number, number] = [34.02, -118.35]

function MapView({ projects, chargers }: MapViewProps) {
  const projectFeatureCollection = {
    type: 'FeatureCollection' as const,
    features: projects,
  }

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON data={projectFeatureCollection} style={{ color: '#8f8e88', weight: 1, fillColor: '#e2e0d9', fillOpacity: 0.55 }} />

      {chargers.map((charger) => {
        // Leaflet expects [lat, lng], while GeoJSON uses [lon, lat].
        const [lon, lat] = charger.position
        return <CircleMarker key={charger.id} center={[lat, lon]} radius={3} pathOptions={{ color: '#63625d', fillColor: '#63625d', fillOpacity: 1 }} />
      })}
    </MapContainer>
  )
}

export default MapView
