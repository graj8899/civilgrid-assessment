import { useEffect } from 'react'
import { CircleMarker, GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'

import { boundsOf } from '../lib/spatial'
import type { Charger, Project, ProjectMatch } from '../lib/types'
import { COLORS, MAP_CENTER, BUFFER_RING_STYLE, CHARGER_TOOLTIP_LABEL } from '../lib/theme'
import { getChargerStatus } from '../lib/chargerStatus'

interface MapViewProps {
  projects: Project[]
  chargers: Charger[]
  selectedId: number | null
  selectedProject: Project | null
  selectedMatch: ProjectMatch | null
  onSelect: (projectId: number | null) => void
}

const center: [number, number] = MAP_CENTER

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

function ProjectLayer({ projects, selectedId, onSelect }: { projects: Project[]; selectedId: number | null; onSelect: (projectId: number | null) => void }) {
  const projectFeatureCollection: FeatureCollection = {
    type: 'FeatureCollection' as const,
    features: projects,
  }

  return (
    <GeoJSON
      key={`cip-${selectedId ?? 'none'}`}
      data={projectFeatureCollection}
      style={(feature) => {
        const isSelected = feature?.properties?.OBJECTID === selectedId
        return {
          color: isSelected ? COLORS.accent : COLORS.inkFaint,
          weight: isSelected ? 2 : 1,
          fillColor: isSelected ? COLORS.accentSoft : COLORS.line,
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
  )
}

function BufferRingLayer({ selectedMatch, selectedProjectObjectId }: { selectedMatch: ProjectMatch | null; selectedProjectObjectId: number | null }) {
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

  if (!selectedBufferFeatureCollection) {
    return null
  }

  return (
    <GeoJSON
      key={`buffer-${selectedProjectObjectId ?? 'none'}`}
      data={selectedBufferFeatureCollection}
      style={BUFFER_RING_STYLE}
      interactive={false}
    />
  )
}

function ChargerLayer({ chargers, selectedMatch }: { chargers: Charger[]; selectedMatch: ProjectMatch | null }) {
  return (
    <>
      {chargers.map((charger) => {
        // Leaflet expects [lat, lng], while GeoJSON uses [lon, lat].
        const [lon, lat] = charger.position
        const status = getChargerStatus(charger.id, selectedMatch)
        const markerColor = status === 'inside' ? COLORS.inside : status === 'nearby' ? COLORS.accent : COLORS.inkSoft
        const markerRadius = status === 'unmatched' ? 3 : 6

        return (
          <CircleMarker
            key={charger.id}
            center={[lat, lon]}
            radius={markerRadius}
            pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 1 }}
            eventHandlers={{
              mouseover: (event) => {
                event.target.bindTooltip(CHARGER_TOOLTIP_LABEL(charger.id), {
                  sticky: true,
                })
              },
            }}
          />
        )
      })}
    </>
  )
}

function MapView({ projects, chargers, selectedId, selectedProject, selectedMatch, onSelect }: MapViewProps) {
  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitToSelection selectedProject={selectedProject} />
      <ProjectLayer projects={projects} selectedId={selectedId} onSelect={onSelect} />
      <BufferRingLayer selectedMatch={selectedMatch} selectedProjectObjectId={selectedProject?.properties.OBJECTID ?? null} />
      <ChargerLayer chargers={chargers} selectedMatch={selectedMatch} />
    </MapContainer>
  )
}

export default MapView
