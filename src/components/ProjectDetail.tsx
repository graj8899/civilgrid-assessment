import { formatCost, formatDate, formatDistricts, formatPhase, formatMatchSummary } from '../lib/formatters'
import type { Project } from '../lib/types'

interface ProjectDetailProps {
  selectedProject: Project | null
  insideCount: number
  nearbyCount: number
  radiusMeters: number
}

function ProjectDetail({ selectedProject, insideCount, nearbyCount, radiusMeters }: ProjectDetailProps) {
  if (!selectedProject) {
    return null
  }

  const constructionWindow = [selectedProject.properties.ConsStartDate ?? null, selectedProject.properties.ConsEndDate ?? null]
    .map((value) => formatDate(value))
    .filter((value) => value !== '—')
    .join(' – ')

  return (
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
  )
}

export default ProjectDetail
