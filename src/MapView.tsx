import { CircleMarker, GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'

import type { Charger, Project } from './types'

interface MapViewProps {
  projects: Project[]
  chargers: Charger[]
  selectedId: number | null
  onSelect: (projectId: number | null) => void
}

const center: [number, number] = [34.02, -118.35]

function MapView({ projects, chargers, selectedId, onSelect }: MapViewProps) {
  const projectFeatureCollection: FeatureCollection = {
    type: 'FeatureCollection' as const,
    features: projects,
  }

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        key={`cip-${selectedId ?? 'none'}`}
        data={projectFeatureCollection}
        style={(feature) => {
          const isSelected = feature?.properties?.OBJECTID === selectedId
          return {
            color: isSelected ? '#185fa5' : '#8f8e88',
            weight: isSelected ? 2 : 1,
            fillColor: isSelected ? '#e6f1fb' : '#e2e0d9',
            fillOpacity: isSelected ? 0.75 : 0.55,
          }
        }}
        onEachFeature={(feature, layer) => {
          const objectId = feature.properties?.OBJECTID
          if (typeof objectId === 'number') {
            layer.bindTooltip(feature.properties?.ProjectTitle ?? 'Project', {
              sticky: true,
            })
            layer.on('click', () => {
              onSelect(objectId)
            })
          }
        }}
      />

      {chargers.map((charger) => {
        // Leaflet expects [lat, lng], while GeoJSON uses [lon, lat].
        const [lon, lat] = charger.position
        return <CircleMarker key={charger.id} center={[lat, lon]} radius={3} pathOptions={{ color: '#63625d', fillColor: '#63625d', fillOpacity: 1 }} />
      })}
    </MapContainer>
  )
}

export default MapView
