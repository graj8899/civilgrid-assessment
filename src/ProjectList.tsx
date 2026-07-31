import type { Project, ProjectMatch } from './types'

interface ProjectListProps {
  projects: Project[]
  matches: Map<number, ProjectMatch>
  selectedId: number | null
  radiusMeters: number
  onSelect: (projectId: number | null) => void
}

export function formatDate(epochMs: number | null): string {
  if (epochMs == null) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(epochMs)
}

export function formatCost(value: number | null): string {
  if (value == null || value === 0) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDistricts(raw: string | null): string {
  if (!raw) {
    return '—'
  }

  const districts = raw
    .split(',')
    .map((district) => district.trim())
    .filter(Boolean)

  return districts.length > 0 ? districts.join(', ') : '—'
}

export function formatPhase(project: Project): string {
  const phase = project.properties.CurrentPhaseDescription?.trim()
  const percent = project.properties.CurrentPhasePercentComplete

  if (phase && percent != null) {
    return `${phase} — ${percent}%`
  }

  if (phase) {
    return phase
  }

  if (percent != null) {
    return `${percent}%`
  }

  return '—'
}

export function formatMatchSummary(insideCount: number, nearbyCount: number, radiusMeters: number): string {
  if (insideCount === 0 && nearbyCount === 0) {
    return 'No chargers matched'
  }

  if (radiusMeters > 0) {
    return `${insideCount} inside footprint · ${nearbyCount} within ${radiusMeters} m`
  }

  return `${insideCount} inside footprint`
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
  const constructionWindow = [selectedProject?.properties.ConsStartDate ?? null, selectedProject?.properties.ConsEndDate ?? null]
    .map((value) => formatDate(value))
    .filter((value) => value !== '—')
    .join(' – ')

  return (
    <div>
      <div className="list-head">
        <span>
          {withMatches} of {projects.length} projects have a charger {radiusMeters > 0 ? `within ${radiusMeters} m` : 'inside'}
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
        <section className="detail" aria-live="polite">
          <div className="count" role="status">
            <span className={insideCount === 0 && nearbyCount === 0 ? 'near' : 'inside'}>
              {formatMatchSummary(insideCount, nearbyCount, radiusMeters)}
            </span>
          </div>

          <h2>{selectedProject.properties.ProjectTitle}</h2>
          <p className="program">{selectedProject.properties.ProgramName}</p>

          <dl className="facts">
            <div>
              <dt>Phase</dt>
              <dd>{formatPhase(selectedProject)}</dd>
            </div>
            <div>
              <dt>Construction window</dt>
              <dd>{constructionWindow || '—'}</dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd>{formatCost(selectedProject.properties.ConstructionCost)}</dd>
            </div>
            <div>
              <dt>Council districts</dt>
              <dd>{formatDistricts(selectedProject.properties.CouncilDistrict)}</dd>
            </div>
            <div>
              <dt>PM</dt>
              <dd>
                {selectedProject.properties.PM_Name && selectedProject.properties.PM_EMail ? (
                  <a href={`mailto:${selectedProject.properties.PM_EMail}`}>
                    {selectedProject.properties.PM_Name}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </section>
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
