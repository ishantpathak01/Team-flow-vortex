import { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';

const STATUS_FILTERS = ['All', 'Active', 'In Review', 'Blocked', 'Completed'];

export function getProjectStatusPillClass(status) {
  switch (status) {
    case 'Active':
    case 'Completed':
      return 'tf-pill-emerald';
    case 'In Review':
      return 'tf-pill-sky';
    case 'Blocked':
      return 'tf-pill-rose';
    default:
      return 'tf-pill-neutral';
  }
}

export function ProjectListing({
  projects,
  onSelectProject,
  onOpenNewProject,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      statusFilter === 'All' || project.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      project.name.toLowerCase().includes(q) ||
      project.goal.toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <main className="tf-container">
      <section style={{ marginBottom: '32px' }}>
        <p className="tf-eyebrow">TEAM WORKSPACE • PROJECTS</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          <div>
            <h1 className="tf-page-title">
              Your team projects.{' '}
              <span className="accent">Moving forward.</span>
            </h1>
            <p className="tf-page-subtitle">
              One connected space for project goals, flexible group tasks,
              review states, and FlowTrace context — no more lost decisions
              across separate chats.
            </p>
          </div>
          <button
            type="button"
            className="tf-btn-secondary"
            onClick={onOpenNewProject}
          >
            + Create Workspace
          </button>
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`tf-pill ${active ? 'tf-pill-emerald' : 'tf-pill-neutral'}`}
                style={{
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--tf-text-muted)',
              }}
            />
            <input
              type="text"
              className="tf-input-field"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', borderRadius: '9999px' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              background: 'rgba(12, 26, 20, 0.8)',
              border: '1px solid var(--tf-border-subtle)',
              borderRadius: '9999px',
              padding: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              style={{
                padding: '6px 10px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background:
                  viewMode === 'grid' ? 'var(--tf-emerald-dim)' : 'transparent',
                color:
                  viewMode === 'grid'
                    ? 'var(--tf-emerald)'
                    : 'var(--tf-text-secondary)',
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              style={{
                padding: '6px 10px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background:
                  viewMode === 'list' ? 'var(--tf-emerald-dim)' : 'transparent',
                color:
                  viewMode === 'list'
                    ? 'var(--tf-emerald)'
                    : 'var(--tf-text-secondary)',
              }}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </section>

      {filteredProjects.length === 0 ? (
        <div
          className="tf-card"
          style={{ padding: '48px 24px', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--tf-text-secondary)', marginBottom: '14px' }}>
            No projects match your current filter.
          </p>
          <button
            type="button"
            className="tf-btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              viewMode === 'grid'
                ? 'repeat(auto-fill, minmax(320px, 1fr))'
                : '1fr',
            gap: '22px',
          }}
        >
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="tf-card tf-card-interactive"
              onClick={() => onSelectProject(project.id)}
              style={{
                padding: '22px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--tf-text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {project.category}
                  </span>
                  <span
                    className={`tf-pill ${getProjectStatusPillClass(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    marginBottom: '8px',
                  }}
                >
                  {project.name}
                </h2>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--tf-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {project.goal}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: 'var(--tf-text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--tf-emerald)',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {project.sprintNote}
                  </span>
                  <span style={{ fontWeight: 600 }}>{project.progress}%</span>
                </div>

                <div className="tf-progress-track" style={{ marginBottom: '16px' }}>
                  <div
                    className="tf-progress-fill"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="tf-avatar-stack">
                    {project.members.slice(0, 4).map((m) => (
                      <span key={m.id} className="tf-avatar" title={m.name}>
                        {m.initials}
                      </span>
                    ))}
                    {project.members.length > 4 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--tf-emerald)',
                          fontWeight: 600,
                          marginLeft: '8px',
                        }}
                      >
                        +{project.members.length - 4}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.8rem',
                      color: 'var(--tf-text-secondary)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Calendar size={13} />
                      {project.deadline}
                    </span>
                    <ArrowRight size={15} color="var(--tf-emerald)" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
