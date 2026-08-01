import ProjectDetail from './ProjectDetail'
import { formatRadiusLabel } from './formatters'
import type { Project, ProjectMatch } from './types'

interface ProjectListProps {
  projects: Project[]
  matches: Map<number, ProjectMatch>
  selectedId: number | null
  radiusMeters: number
  onSelect: (projectId: number | null) => void
}

function ProjectList({ projects, matches, selectedId, radiusMeters, onSelect }: ProjectListProps) {
  const withMatches = projects.filter((project) => {
    const match = matches.get(project.properties.OBJECTID)
    return (match?.inside.length ?? 0) + (match?.nearby.length ?? 0) > 0
  }).length

  const selectedProject = projects.find((project) => project.properties.OBJECTID === selectedId) ?? null
  const selectedMatch = selectedProject ? matches.get(selectedProject.properties.OBJECTID) : null
  const insideCount = selectedMatch?.inside.length ?? 0
  const nearbyCount = selectedMatch?.nearby.length ?? 0

  return (
    <div>
      <div className="list-head">
        <span>
          {withMatches} of {projects.length} projects have a charger {formatRadiusLabel(radiusMeters)}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="detail" role="status">
          <p className="program">No projects are loaded yet.</p>
        </div>
      ) : (
        projects.map((project) => {
          const match = matches.get(project.properties.OBJECTID)
          const count = (match?.inside.length ?? 0) + (match?.nearby.length ?? 0)
          const isSelected = selectedId === project.properties.OBJECTID

          return (
            <button
              key={project.properties.OBJECTID}
              type="button"
              className={`row${count > 0 ? ' has' : ''}`}
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(isSelected ? null : project.properties.OBJECTID)}
            >
              <span className={`chip${count > 0 ? ' has' : ''}`}>{count}</span>
              <span className="row-body">
                <span className="row-title">{project.properties.ProjectTitle}</span>
                <span className="row-meta">{project.properties.ProgramName}</span>
              </span>
            </button>
          )
        })
      )}

      {selectedProject ? (
        <ProjectDetail
          selectedProject={selectedProject}
          insideCount={insideCount}
          nearbyCount={nearbyCount}
          radiusMeters={radiusMeters}
        />
      ) : (
        <div className="detail" role="status">
          <p className="program">No project selected. Choose a project footprint to inspect its charger matches.</p>
        </div>
      )}

      <div className="legend" role="note">
        <span className="legend-item"><span className="dot inside" />inside footprint</span>
        <span className="legend-item"><span className="dot nearby" />within radius</span>
        <span className="legend-item"><span className="dot unmatched" />unmatched</span>
      </div>
    </div>
  )
}

export default ProjectList
