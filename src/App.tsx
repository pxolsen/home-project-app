import { useEffect, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  FileText,
  Hammer,
  Home,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { vendors } from "./data";
import {
  currency,
  getProjectBudget,
  historyRecordToTimelineEvent,
  projectToTimelineEvent,
  type HistoryRecord,
  type Project,
  type TimelineEvent,
} from "./domain";
import { HistoryRecordModal } from "./components/HistoryRecordModal";
import { Metric } from "./components/Metric";
import { ProjectEditorModal } from "./components/ProjectEditorModal";
import { ProjectContractorSummary } from "./components/ProjectContractorSummary";
import {
  HISTORY_RECORDS_STORAGE_KEY,
  loadStoredHistoryRecords,
  loadStoredProjects,
  PROJECTS_STORAGE_KEY,
} from "./storage";

type ProjectFilter = "All" | "Urgent" | "Done";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(loadStoredProjects);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(
    loadStoredHistoryRecords,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("All");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingHistoryRecordId, setEditingHistoryRecordId] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    window.localStorage.setItem(
      HISTORY_RECORDS_STORAGE_KEY,
      JSON.stringify(historyRecords),
    );
  }, [historyRecords]);

  const totalEstimated = projects.reduce((sum, project) => sum + getProjectBudget(project), 0);
  const activeProjects = projects.filter((project) => project.status !== "Done");
  const urgentCount = projects.filter((project) => project.priority === "Urgent").length;
  const editingProject = projects.find((project) => project.id === editingProjectId);
  const editingHistoryRecord = historyRecords.find(
    (record) => record.id === editingHistoryRecordId,
  );
  const homeHistory = [
    ...projects.filter((project) => project.status === "Done").map(projectToTimelineEvent),
    ...historyRecords.map(historyRecordToTimelineEvent),
  ];
  const completedSpend = homeHistory.reduce((sum, event) => sum + event.amount, 0);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredProjects = projects.filter(
    (project) =>
      matchesProjectFilter(project, projectFilter) &&
      matchesSearch(projectSearchText(project), normalizedSearch),
  );
  const filteredHomeHistory = homeHistory.filter((event) =>
    matchesSearch(historySearchText(event), normalizedSearch),
  );
  const filteredVendors = vendors.filter((vendor) =>
    matchesSearch(`${vendor.name} ${vendor.trade} ${vendor.note} ${vendor.rating}`, normalizedSearch),
  );
  const hasSearch = normalizedSearch.length > 0;

  function addProject(project: Project) {
    setProjects((currentProjects) => [project, ...currentProjects]);
    setIsProjectModalOpen(false);
  }

  function updateProject(project: Project) {
    setProjects((currentProjects) =>
      currentProjects.map((currentProject) =>
        currentProject.id === project.id ? project : currentProject,
      ),
    );
    setEditingProjectId(null);
  }

  function addHistoryRecord(record: HistoryRecord) {
    setHistoryRecords((currentRecords) => [record, ...currentRecords]);
    setIsHistoryModalOpen(false);
  }

  function updateHistoryRecord(record: HistoryRecord) {
    setHistoryRecords((currentRecords) =>
      currentRecords.map((currentRecord) =>
        currentRecord.id === record.id ? record : currentRecord,
      ),
    );
    setEditingHistoryRecordId(null);
  }

  function deleteHistoryRecord(recordId: string) {
    setHistoryRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== recordId),
    );
    setEditingHistoryRecordId(null);
  }

  function openHistoryEvent(event: TimelineEvent) {
    if (event.source === "project") {
      setEditingProjectId(event.id);
      return;
    }

    setEditingHistoryRecordId(event.id);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <span className="brand-mark">
            <Home size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>Homelog</strong>
            <span>Project command center</span>
          </div>
        </div>

        <nav className="nav-list">
          <a className="active" href="#dashboard">
            <ClipboardList size={18} aria-hidden="true" />
            Dashboard
          </a>
          <a href="#timeline">
            <CalendarClock size={18} aria-hidden="true" />
            Timeline
          </a>
          <a href="#vendors">
            <Users size={18} aria-hidden="true" />
            Vendors
          </a>
          <a href="#documents">
            <FileText size={18} aria-hidden="true" />
            Documents
          </a>
        </nav>

        <section className="home-card">
          <span>Current home</span>
          <strong>Maple Street House</strong>
          <p>Built 1938 · 2,180 sq ft · Colonial</p>
        </section>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today&apos;s plan</p>
            <h1>Make the next home decision obvious.</h1>
          </div>
          <div className="topbar-actions">
            <label className="search" aria-label="Search projects">
              <Search size={17} aria-hidden="true" />
              <input
                placeholder="Search projects, vendors, receipts"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <button className="primary-button" onClick={() => setIsProjectModalOpen(true)}>
              <Plus size={18} aria-hidden="true" />
              Add project
            </button>
          </div>
        </header>

        <section className="metric-grid" aria-label="Home project summary">
          <Metric
            icon={<Hammer size={20} />}
            label="Active projects"
            value={activeProjects.length.toString()}
            detail={`${urgentCount} need attention soon`}
          />
          <Metric
            icon={<WalletCards size={20} />}
            label="Estimated pipeline"
            value={currency.format(totalEstimated)}
            detail="Across ideas, quotes, and scheduled work"
          />
          <Metric
            icon={<ReceiptText size={20} />}
            label="Documented spend"
            value={currency.format(completedSpend)}
            detail="Receipts and warranties attached"
          />
          <Metric
            icon={<ShieldCheck size={20} />}
            label="Buyer-ready records"
            value={homeHistory.length.toString()}
            detail="Completed events in the home history"
          />
        </section>

        <section className="work-area" id="dashboard">
          <div className="panel project-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Project board</p>
                <h2>Prioritized next work</h2>
              </div>
              <div className="segmented-control" aria-label="Project filter">
                {(["All", "Urgent", "Done"] as ProjectFilter[]).map((filter) => (
                  <button
                    className={projectFilter === filter ? "selected" : ""}
                    key={filter}
                    type="button"
                    onClick={() => setProjectFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="project-list">
              {filteredProjects.map((project) => (
                <button
                  className="project-row"
                  key={project.id}
                  type="button"
                  onClick={() => setEditingProjectId(project.id)}
                >
                  <div className="project-main">
                    <span className={`priority ${project.priority.toLowerCase()}`}>
                      {project.priority}
                    </span>
                    <div>
                      <h3>{project.title}</h3>
                      <p>
                        {project.category} · {project.timing} · {project.owner}
                      </p>
                      <ProjectContractorSummary project={project} />
                    </div>
                  </div>
                  <div className="project-meta">
                    <span>{project.status}</span>
                    <strong>{currency.format(getProjectBudget(project))}</strong>
                  </div>
                </button>
              ))}
              {filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <p>No projects match the current search or filter.</p>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="panel focus-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Decision helper</p>
                <h2>What to do next</h2>
              </div>
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <ol className="next-list">
              <li>
                <strong>Book the water heater replacement.</strong>
                <span>Highest urgency and already quoted.</span>
              </li>
              <li>
                <strong>Keep HVAC service on the calendar.</strong>
                <span>Low cost, protects a major system.</span>
              </li>
              <li>
                <strong>Delay floor refinishing until budget is clear.</strong>
                <span>High impact, but flexible timing.</span>
              </li>
            </ol>
          </aside>
        </section>

        <section className="lower-grid">
          <div className="panel" id="timeline">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Home history</p>
                <h2>Completed work</h2>
              </div>
              <button
                className="secondary-button compact-button"
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
              >
                <Plus size={17} aria-hidden="true" />
                Log past work
              </button>
            </div>
            <div className="timeline">
              {filteredHomeHistory.map((event) => (
                <button
                  className="timeline-item"
                  key={`${event.source}-${event.id}`}
                  type="button"
                  onClick={() => openHistoryEvent(event)}
                >
                  <span>{event.date}</span>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.detail}</p>
                  </div>
                  <strong>{event.amount ? currency.format(event.amount) : "Logged"}</strong>
                </button>
              ))}
              {filteredHomeHistory.length === 0 ? (
                <div className="empty-state">
                  <p>No history records match the current search.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel" id="vendors">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">People</p>
                <h2>Trusted vendors</h2>
              </div>
              <Users size={20} aria-hidden="true" />
            </div>
            <div className="vendor-list">
              {filteredVendors.map((vendor) => (
                <article className="vendor-card" key={vendor.name}>
                  <div>
                    <h3>{vendor.name}</h3>
                    <p>{vendor.trade}</p>
                  </div>
                  <span>{vendor.rating}</span>
                  <p>{vendor.note}</p>
                </article>
              ))}
              {filteredVendors.length === 0 ? (
                <div className="empty-state">
                  <p>No vendors match the current search.</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
        {hasSearch ? (
          <p className="search-summary">
            Showing {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"},{" "}
            {filteredHomeHistory.length} history record
            {filteredHomeHistory.length === 1 ? "" : "s"}, and {filteredVendors.length} vendor
            {filteredVendors.length === 1 ? "" : "s"} for "{searchQuery.trim()}".
          </p>
        ) : null}
      </section>

      {isProjectModalOpen ? (
        <ProjectEditorModal
          heading="Add a home project"
          eyebrow="New project"
          onClose={() => setIsProjectModalOpen(false)}
          onSave={addProject}
          submitLabel="Save project"
        />
      ) : null}

      {editingProject ? (
        <ProjectEditorModal
          heading="Edit project"
          eyebrow={editingProject.title}
          initialProject={editingProject}
          onClose={() => setEditingProjectId(null)}
          onSave={updateProject}
          submitLabel="Update project"
        />
      ) : null}

      {isHistoryModalOpen ? (
        <HistoryRecordModal
          heading="Log past work"
          eyebrow="Home history"
          onClose={() => setIsHistoryModalOpen(false)}
          onSave={addHistoryRecord}
          submitLabel="Save history"
        />
      ) : null}

      {editingHistoryRecord ? (
        <HistoryRecordModal
          heading="Edit history record"
          eyebrow={editingHistoryRecord.title}
          initialRecord={editingHistoryRecord}
          onClose={() => setEditingHistoryRecordId(null)}
          onDelete={() => deleteHistoryRecord(editingHistoryRecord.id)}
          onSave={updateHistoryRecord}
          submitLabel="Update history"
        />
      ) : null}
    </main>
  );
}

function matchesProjectFilter(project: Project, filter: ProjectFilter) {
  if (filter === "Urgent") {
    return project.priority === "Urgent";
  }

  if (filter === "Done") {
    return project.status === "Done";
  }

  return true;
}

function matchesSearch(text: string, query: string) {
  return query.length === 0 || text.toLowerCase().includes(query);
}

function projectSearchText(project: Project) {
  const contractorText =
    project.contractors
      ?.map((contractor) =>
        [
          contractor.name,
          contractor.trade,
          contractor.contact,
          contractor.notes,
          contractor.quotedAmount,
        ].join(" "),
      )
      .join(" ") ?? "";
  const attachmentText =
    project.attachments
      ?.map((attachment) => [attachment.name, attachment.type, attachment.notes].join(" "))
      .join(" ") ?? "";

  return [
    project.title,
    project.category,
    project.priority,
    project.status,
    project.executionType,
    project.timing,
    project.owner,
    project.notes,
    project.estimate,
    project.actual,
    contractorText,
    attachmentText,
  ].join(" ");
}

function historySearchText(event: TimelineEvent) {
  return [event.date, event.title, event.detail, event.amount, event.source].join(" ");
}
