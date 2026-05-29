import type { HistoryRecord, Project, Vendor } from "./domain";

export const initialProjects: Project[] = [
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
    attachments: [
      {
        id: "dishwasher-receipt",
        name: "Dishwasher receipt",
        type: "Receipt",
        notes: "Store file upload here later.",
      },
      {
        id: "dishwasher-warranty",
        name: "Manufacturer warranty",
        type: "Warranty",
      },
    ],
  },
];

export const initialHistoryRecords: HistoryRecord[] = [
  {
    id: "chimney-inspection",
    title: "Chimney inspection",
    category: "Inspection",
    completedDate: "Mar 2026",
    amount: 185,
    executionType: "Professional",
    contractor: "Certified chimney inspector",
    notes: "No immediate repair needed. Recheck before winter.",
    attachments: [
      {
        id: "chimney-report",
        name: "Inspection report",
        type: "Other",
      },
    ],
  },
  {
    id: "electrical-panel-labeled",
    title: "Electrical panel labeled",
    category: "Electrical",
    completedDate: "Jan 2026",
    amount: 0,
    executionType: "DIY",
    contractor: "",
    notes: "Updated breaker labels and photographed panel state.",
  },
];

export const vendors: Vendor[] = [
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

