import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
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
  X,
} from "lucide-react";

type ProjectStatus = "Idea" | "Quoted" | "Scheduled" | "In progress" | "Done";
type ProjectPriority = "Urgent" | "Soon" | "Someday";
type ExecutionType = "DIY" | "Professional";

type ContractorQuote = {
  id: string;
  name: string;
  trade: string;
  contact: string;
  quotedAmount?: number;
  notes?: string;
};

type Project = {
  id: string;
  title: string;
  category: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  executionType: ExecutionType;
  estimate: number;
  actual?: number;
  timing: string;
  owner: string;
  notes?: string;
  contractors?: ContractorQuote[];
  selectedContractorId?: string;
};

type TimelineEvent = {
  date: string;
  title: string;
  detail: string;
  amount: number;
};

type Vendor = {
  name: string;
  trade: string;
  note: string;
  rating: string;
};

type ProjectFormState = {
  title: string;
  category: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  executionType: ExecutionType;
  estimate: string;
  timing: string;
  owner: string;
  notes: string;
  selectedContractorId: string;
};

type ContractorFormState = {
  id: string;
  name: string;
  trade: string;
  contact: string;
  quotedAmount: string;
  notes: string;
};

const STORAGE_KEY = "home-project-app.projects";

const emptyProjectForm: ProjectFormState = {
  title: "",
  category: "Maintenance",
  priority: "Soon",
  status: "Idea",
  executionType: "DIY",
  estimate: "",
  timing: "",
  owner: "",
  notes: "",
  selectedContractorId: "",
};

const emptyContractorForm = (): ContractorFormState => ({
  id: crypto.randomUUID(),
  name: "",
  trade: "",
  contact: "",
  quotedAmount: "",
  notes: "",
});

const professionalQuoteStatuses: ProjectStatus[] = ["Idea", "Quoted"];

const canAddPotentialContractors = (status: ProjectStatus) =>
  professionalQuoteStatuses.includes(status);

const getProjectBudget = (project: Project) => {
  if (project.executionType === "DIY") {
    return project.actual ?? project.estimate;
  }

  const selectedContractor = project.contractors?.find(
    (contractor) => contractor.id === project.selectedContractorId,
  );

  if (selectedContractor?.quotedAmount) {
    return selectedContractor.quotedAmount;
  }

  const quotedAmounts =
    project.contractors
      ?.map((contractor) => contractor.quotedAmount)
      .filter((amount): amount is number => typeof amount === "number") ?? [];

  return quotedAmounts.length ? Math.min(...quotedAmounts) : project.estimate;
};

const initialProjects: Project[] = [
  {
    id: "water-heater",
    title: "Replace aging water heater",
    category: "Plumbing",
    priority: "Urgent",
    status: "Quoted",
    executionType: "Professional",
    estimate: 2600,
    timing: "May 2026",
    owner: "Peter",
    contractors: [
      {
        id: "northline-water-heater",
        name: "Northline Plumbing",
        trade: "Plumbing",
        contact: "office@northline.example",
        quotedAmount: 2600,
        notes: "Can schedule within two weeks.",
      },
    ],
  },
  {
    id: "oak-floors",
    title: "Refinish oak floors upstairs",
    category: "Renovation",
    priority: "Soon",
    status: "Idea",
    executionType: "Professional",
    estimate: 7200,
    timing: "Summer 2026",
    owner: "Peter + wife",
  },
  {
    id: "hvac-service",
    title: "Annual HVAC service",
    category: "Maintenance",
    priority: "Soon",
    status: "Scheduled",
    executionType: "Professional",
    estimate: 225,
    timing: "June 2026",
    owner: "Vendor",
    contractors: [
      {
        id: "evergreen-hvac-service",
        name: "Evergreen HVAC",
        trade: "HVAC",
        contact: "service@evergreen.example",
        quotedAmount: 225,
      },
    ],
    selectedContractorId: "evergreen-hvac-service",
  },
  {
    id: "guest-room-paint",
    title: "Paint guest room",
    category: "Cosmetic",
    priority: "Someday",
    status: "Idea",
    executionType: "DIY",
    estimate: 480,
    timing: "Fall 2026",
    owner: "DIY",
  },
  {
    id: "dishwasher-install",
    title: "Install dishwasher",
    category: "Appliance",
    priority: "Urgent",
    status: "Done",
    executionType: "Professional",
    estimate: 900,
    actual: 840,
    timing: "April 2026",
    owner: "Vendor",
  },
];

const timeline: TimelineEvent[] = [
  {
    date: "Apr 2026",
    title: "Dishwasher installed",
    detail: "Model, receipt, warranty, and installer notes saved.",
    amount: 840,
  },
  {
    date: "Mar 2026",
    title: "Chimney inspection",
    detail: "No immediate repair needed. Recheck before winter.",
    amount: 185,
  },
  {
    date: "Jan 2026",
    title: "Electrical panel labeled",
    detail: "Updated breaker labels and photographed panel state.",
    amount: 0,
  },
];

const vendors: Vendor[] = [
  {
    name: "Northline Plumbing",
    trade: "Plumbing",
    note: "Clear quotes, responsive scheduling.",
    rating: "Would hire again",
  },
  {
    name: "Bright Circuit Co.",
    trade: "Electrical",
    note: "Good diagnostic work, premium pricing.",
    rating: "Maybe",
  },
  {
    name: "Evergreen HVAC",
    trade: "HVAC",
    note: "Handles annual service plan.",
    rating: "Would hire again",
  },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function App() {
  const [projects, setProjects] = useState<Project[]>(loadStoredProjects);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const totalEstimated = projects.reduce((sum, project) => sum + getProjectBudget(project), 0);
  const completedSpend = projects.reduce((sum, project) => sum + (project.actual ?? 0), 0);
  const activeProjects = projects.filter((project) => project.status !== "Done");
  const urgentCount = projects.filter((project) => project.priority === "Urgent").length;

  function addProject(project: Project) {
    setProjects((currentProjects) => [project, ...currentProjects]);
    setIsProjectModalOpen(false);
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
              <input placeholder="Search projects, vendors, receipts" />
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
            value="3"
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
                <button className="selected">All</button>
                <button>Urgent</button>
                <button>Done</button>
              </div>
            </div>

            <div className="project-list">
              {projects.map((project) => (
                <article className="project-row" key={project.id}>
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
                </article>
              ))}
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
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <div className="timeline">
              {timeline.map((event) => (
                <article className="timeline-item" key={event.title}>
                  <span>{event.date}</span>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.detail}</p>
                  </div>
                  <strong>{event.amount ? currency.format(event.amount) : "Logged"}</strong>
                </article>
              ))}
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
              {vendors.map((vendor) => (
                <article className="vendor-card" key={vendor.name}>
                  <div>
                    <h3>{vendor.name}</h3>
                    <p>{vendor.trade}</p>
                  </div>
                  <span>{vendor.rating}</span>
                  <p>{vendor.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      {isProjectModalOpen ? (
        <ProjectModal
          onClose={() => setIsProjectModalOpen(false)}
          onSave={addProject}
        />
      ) : null}
    </main>
  );
}

function loadStoredProjects() {
  if (typeof window === "undefined") {
    return initialProjects;
  }

  const storedProjects = window.localStorage.getItem(STORAGE_KEY);
  if (!storedProjects) {
    return initialProjects;
  }

  try {
    const parsedProjects = JSON.parse(storedProjects);
    return Array.isArray(parsedProjects)
      ? parsedProjects.map(normalizeProject)
      : initialProjects;
  } catch {
    return initialProjects;
  }
}

function normalizeProject(project: Project) {
  return {
    ...project,
    executionType: project.executionType ?? inferExecutionType(project),
    contractors: project.contractors ?? [],
  };
}

function inferExecutionType(project: Project) {
  return project.owner === "DIY" ? "DIY" : "Professional";
}

function ProjectContractorSummary({ project }: { project: Project }) {
  if (project.executionType === "DIY") {
    return <p className="project-subdetail">DIY estimate</p>;
  }

  const contractors = project.contractors ?? [];
  const selectedContractor = contractors.find(
    (contractor) => contractor.id === project.selectedContractorId,
  );

  if (selectedContractor) {
    return (
      <p className="project-subdetail">
        Selected: {selectedContractor.name}
        {selectedContractor.quotedAmount
          ? ` · ${currency.format(selectedContractor.quotedAmount)}`
          : ""}
      </p>
    );
  }

  if (contractors.length > 0) {
    return (
      <p className="project-subdetail">
        Professional · {contractors.length} contractor
        {contractors.length === 1 ? "" : "s"} under consideration
      </p>
    );
  }

  return <p className="project-subdetail">Professional · No contractors added yet</p>;
}

function ProjectModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (project: Project) => void;
}) {
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [contractors, setContractors] = useState<ContractorFormState[]>([]);

  function updateForm<Field extends keyof ProjectFormState>(
    field: Field,
    value: ProjectFormState[Field],
  ) {
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      if (field === "executionType" && value === "DIY") {
        nextForm.selectedContractorId = "";
      }

      return nextForm;
    });
  }

  function addContractor() {
    const contractor = emptyContractorForm();
    setContractors((currentContractors) => [...currentContractors, contractor]);
  }

  function removeContractor(contractorId: string) {
    setContractors((currentContractors) =>
      currentContractors.filter((contractor) => contractor.id !== contractorId),
    );
    if (form.selectedContractorId === contractorId) {
      updateForm("selectedContractorId", "");
    }
  }

  function updateContractor<Field extends keyof ContractorFormState>(
    contractorId: string,
    field: Field,
    value: ContractorFormState[Field],
  ) {
    setContractors((currentContractors) =>
      currentContractors.map((contractor) =>
        contractor.id === contractorId ? { ...contractor, [field]: value } : contractor,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const estimate = Number(form.estimate);
    const savedContractors =
      form.executionType === "Professional"
        ? contractors
            .filter((contractor) => contractor.name.trim())
            .map((contractor) => {
              const quotedAmount = Number(contractor.quotedAmount);

              return {
                id: contractor.id,
                name: contractor.name.trim(),
                trade: contractor.trade.trim(),
                contact: contractor.contact.trim(),
                quotedAmount: Number.isFinite(quotedAmount) ? quotedAmount : undefined,
                notes: contractor.notes.trim() || undefined,
              };
            })
        : [];

    const selectedContractorStillExists = savedContractors.some(
      (contractor) => contractor.id === form.selectedContractorId,
    );

    onSave({
      id: crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      status: form.status,
      executionType: form.executionType,
      estimate: Number.isFinite(estimate) ? estimate : 0,
      timing: form.timing.trim() || "Unscheduled",
      owner:
        form.executionType === "DIY"
          ? form.owner.trim() || "DIY"
          : form.owner.trim() || "Professional",
      notes: form.notes.trim() || undefined,
      contractors: savedContractors,
      selectedContractorId: selectedContractorStillExists
        ? form.selectedContractorId
        : undefined,
    });
  }

  const showDiyEstimate = form.executionType === "DIY";
  const showContractors = form.executionType === "Professional";
  const canAddContractorsForStatus = canAddPotentialContractors(form.status);

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="add-project-title"
        aria-modal="true"
        className="modal"
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">New project</p>
            <h2 id="add-project-title">Add a home project</h2>
          </div>
          <button aria-label="Close add project dialog" className="icon-button" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label className="field full-span">
            <span>Project title</span>
            <input
              autoFocus
              required
              placeholder="Replace porch light fixture"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
            >
              <option>Maintenance</option>
              <option>Repair</option>
              <option>Renovation</option>
              <option>Appliance</option>
              <option>Cosmetic</option>
              <option>Outdoor</option>
              <option>Planning</option>
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              value={form.priority}
              onChange={(event) => updateForm("priority", event.target.value as ProjectPriority)}
            >
              <option>Urgent</option>
              <option>Soon</option>
              <option>Someday</option>
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value as ProjectStatus)}
            >
              <option>Idea</option>
              <option>Quoted</option>
              <option>Scheduled</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </label>

          <fieldset className="choice-field full-span">
            <legend>Who will do the work?</legend>
            <label className={form.executionType === "DIY" ? "choice selected" : "choice"}>
              <input
                checked={form.executionType === "DIY"}
                name="executionType"
                type="radio"
                value="DIY"
                onChange={() => updateForm("executionType", "DIY")}
              />
              <span>
                <strong>DIY</strong>
                <small>Track your own time, materials, and cost.</small>
              </span>
            </label>
            <label
              className={form.executionType === "Professional" ? "choice selected" : "choice"}
            >
              <input
                checked={form.executionType === "Professional"}
                name="executionType"
                type="radio"
                value="Professional"
                onChange={() => updateForm("executionType", "Professional")}
              />
              <span>
                <strong>Professional</strong>
                <small>Compare quotes and choose a contractor.</small>
              </span>
            </label>
          </fieldset>

          {showDiyEstimate ? (
            <label className="field">
              <span>Estimated cost</span>
              <input
                min="0"
                placeholder="1200"
                type="number"
                value={form.estimate}
                onChange={(event) => updateForm("estimate", event.target.value)}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Timing</span>
            <input
              placeholder="Summer 2026"
              value={form.timing}
              onChange={(event) => updateForm("timing", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Owner</span>
            <input
              placeholder="Peter + wife"
              value={form.owner}
              onChange={(event) => updateForm("owner", event.target.value)}
            />
          </label>

          {showContractors ? (
            <section className="contractor-section full-span">
              <div className="contractor-heading">
                <div>
                  <h3>Potential contractors</h3>
                  <p>
                    {canAddContractorsForStatus
                      ? "Add contractors you are researching or have received quotes from."
                      : "Keep the quote history and select who will do the work."}
                  </p>
                </div>
                <button className="secondary-button" type="button" onClick={addContractor}>
                  <Plus size={17} aria-hidden="true" />
                  Add contractor
                </button>
              </div>

              {contractors.length ? (
                <div className="contractor-list">
                  {contractors.map((contractor, index) => (
                    <article className="contractor-form-card" key={contractor.id}>
                      <div className="contractor-card-heading">
                        <strong>Contractor {index + 1}</strong>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => removeContractor(contractor.id)}
                        >
                          Remove
                        </button>
                      </div>
                      <label className="field">
                        <span>Name</span>
                        <input
                          placeholder="Northline Plumbing"
                          value={contractor.name}
                          onChange={(event) =>
                            updateContractor(contractor.id, "name", event.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Trade</span>
                        <input
                          placeholder="Plumbing"
                          value={contractor.trade}
                          onChange={(event) =>
                            updateContractor(contractor.id, "trade", event.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Contact</span>
                        <input
                          placeholder="Phone or email"
                          value={contractor.contact}
                          onChange={(event) =>
                            updateContractor(contractor.id, "contact", event.target.value)
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Quoted estimate</span>
                        <input
                          min="0"
                          placeholder="2600"
                          type="number"
                          value={contractor.quotedAmount}
                          onChange={(event) =>
                            updateContractor(contractor.id, "quotedAmount", event.target.value)
                          }
                        />
                      </label>
                      <label className="field full-span">
                        <span>Contractor notes</span>
                        <textarea
                          placeholder="Availability, quote details, concerns, or why you liked them."
                          rows={3}
                          value={contractor.notes}
                          onChange={(event) =>
                            updateContractor(contractor.id, "notes", event.target.value)
                          }
                        />
                      </label>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-contractors">
                  <p>No contractors added yet.</p>
                </div>
              )}

              {contractors.length ? (
                <label className="field">
                  <span>Selected contractor</span>
                  <select
                    value={form.selectedContractorId}
                    onChange={(event) =>
                      updateForm("selectedContractorId", event.target.value)
                    }
                  >
                    <option value="">Not selected yet</option>
                    {contractors.map((contractor, index) => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name.trim() || `Contractor ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </section>
          ) : null}

          <label className="field full-span">
            <span>Notes</span>
            <textarea
              placeholder="Quotes, constraints, links, measurements, or anything you want future-you to remember."
              rows={4}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
            />
          </label>

          <div className="modal-actions full-span">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              Save project
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon" aria-hidden="true">
        {icon}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
