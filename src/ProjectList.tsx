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

  return (
    <div>
      <div className="list-head">
        <span>
          {withMatches} of {projects.length} projects have a charger {radiusMeters > 0 ? `within ${radiusMeters} m` : 'inside'}
        </span>
      </div>

      {projects.map((project) => {
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
      })}
    </div>
  )
}

export default ProjectList
