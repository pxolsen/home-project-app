import type { ReactNode } from "react";
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
} from "lucide-react";

type ProjectStatus = "Idea" | "Quoted" | "Scheduled" | "In progress" | "Done";
type ProjectPriority = "Urgent" | "Soon" | "Someday";

type Project = {
  title: string;
  category: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  estimate: number;
  actual?: number;
  timing: string;
  owner: string;
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

const projects: Project[] = [
  {
    title: "Replace aging water heater",
    category: "Plumbing",
    priority: "Urgent",
    status: "Quoted",
    estimate: 2600,
    timing: "May 2026",
    owner: "Peter",
  },
  {
    title: "Refinish oak floors upstairs",
    category: "Renovation",
    priority: "Soon",
    status: "Idea",
    estimate: 7200,
    timing: "Summer 2026",
    owner: "Peter + wife",
  },
  {
    title: "Annual HVAC service",
    category: "Maintenance",
    priority: "Soon",
    status: "Scheduled",
    estimate: 225,
    timing: "June 2026",
    owner: "Vendor",
  },
  {
    title: "Paint guest room",
    category: "Cosmetic",
    priority: "Someday",
    status: "Idea",
    estimate: 480,
    timing: "Fall 2026",
    owner: "DIY",
  },
  {
    title: "Install dishwasher",
    category: "Appliance",
    priority: "Urgent",
    status: "Done",
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
  const totalEstimated = projects.reduce((sum, project) => sum + project.estimate, 0);
  const completedSpend = projects.reduce((sum, project) => sum + (project.actual ?? 0), 0);
  const activeProjects = projects.filter((project) => project.status !== "Done");
  const urgentCount = projects.filter((project) => project.priority === "Urgent").length;

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
            <button className="primary-button">
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
                <article className="project-row" key={project.title}>
                  <div className="project-main">
                    <span className={`priority ${project.priority.toLowerCase()}`}>
                      {project.priority}
                    </span>
                    <div>
                      <h3>{project.title}</h3>
                      <p>
                        {project.category} · {project.timing} · {project.owner}
                      </p>
                    </div>
                  </div>
                  <div className="project-meta">
                    <span>{project.status}</span>
                    <strong>{currency.format(project.actual ?? project.estimate)}</strong>
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
    </main>
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
