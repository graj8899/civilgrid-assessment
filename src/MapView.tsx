import { useEffect } from 'react'
import { CircleMarker, GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'

import { boundsOf } from './spatial'
import type { Charger, Project, ProjectMatch } from './types'

interface MapViewProps {
  projects: Project[]
  chargers: Charger[]
  selectedId: number | null
  selectedProject: Project | null
  selectedMatch: ProjectMatch | null
  onSelect: (projectId: number | null) => void
}

const center: [number, number] = [34.02, -118.35]

function FitToSelection({ selectedProject }: { selectedProject: Project | null }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedProject) {
      return
    }

    const [minLon, minLat, maxLon, maxLat] = boundsOf(selectedProject.geometry)
    map.fitBounds(
      [
        [minLat, minLon],
        [maxLat, maxLon],
      ],
      {
        padding: [64, 64],
        maxZoom: 16,
      },
    )
  }, [map, selectedProject])

  return null
}

function MapView({ projects, chargers, selectedId, selectedProject, selectedMatch, onSelect }: MapViewProps) {
  const projectFeatureCollection: FeatureCollection = {
    type: 'FeatureCollection' as const,
    features: projects,
  }

  const selectedBufferFeatureCollection: FeatureCollection | null = selectedMatch?.bufferGeometry
    ? {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: selectedMatch.bufferGeometry,
          },
        ],
      }
    : null

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToSelection selectedProject={selectedProject} />

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

      {selectedBufferFeatureCollection ? (
        <GeoJSON
          key={`buffer-${selectedProject?.properties.OBJECTID ?? 'none'}`}
          data={selectedBufferFeatureCollection}
          style={{ color: '#0f6e56', weight: 2, fill: false, dashArray: '5 5' }}
          interactive={false}
        />
      ) : null}

      {chargers.map((charger) => {
        // Leaflet expects [lat, lng], while GeoJSON uses [lon, lat].
        const [lon, lat] = charger.position
        const isInside = selectedMatch?.inside.includes(charger.id) ?? false
        const isNearby = selectedMatch?.nearby.includes(charger.id) ?? false
        const markerColor = isInside ? '#0f6e56' : isNearby ? '#185fa5' : '#63625d'
        const markerRadius = isInside || isNearby ? 6 : 3

        return (
          <CircleMarker
            key={charger.id}
            center={[lat, lon]}
            radius={markerRadius}
            pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 1 }}
          />
        )
      })}
    </MapContainer>
  )
}

export default MapView
