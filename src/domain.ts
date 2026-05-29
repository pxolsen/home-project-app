import type { ReactNode } from "react";

export type ProjectStatus = "Idea" | "Quoted" | "Scheduled" | "In progress" | "Done";
export type ProjectPriority = "Urgent" | "Soon" | "Someday";
export type ExecutionType = "DIY" | "Professional";
export type AttachmentType = "Receipt" | "Warranty" | "Permit" | "Quote" | "Photo" | "Other";

export type Attachment = {
  id: string;
  name: string;
  type: AttachmentType;
  notes?: string;
};

export type ContractorQuote = {
  id: string;
  name: string;
  trade: string;
  contact: string;
  quotedAmount?: number;
  notes?: string;
};

export type Project = {
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
  attachments?: Attachment[];
};

export type HistoryRecord = {
  id: string;
  title: string;
  category: string;
  completedDate: string;
  amount: number;
  executionType: ExecutionType;
  contractor: string;
  notes?: string;
  attachments?: Attachment[];
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  amount: number;
  source: "project" | "record";
};

export type Vendor = {
  name: string;
  trade: string;
  note: string;
  rating: string;
};

export type ProjectFormState = {
  title: string;
  category: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  executionType: ExecutionType;
  estimate: string;
  actual: string;
  timing: string;
  owner: string;
  notes: string;
  selectedContractorId: string;
};

export type HistoryRecordFormState = {
  title: string;
  category: string;
  completedDate: string;
  amount: string;
  executionType: ExecutionType;
  contractor: string;
  notes: string;
};

export type ContractorFormState = {
  id: string;
  name: string;
  trade: string;
  contact: string;
  quotedAmount: string;
  notes: string;
  isSaved: boolean;
  isExpanded: boolean;
};

export type AttachmentFormState = {
  id: string;
  name: string;
  type: AttachmentType;
  notes: string;
  isSaved: boolean;
  isExpanded: boolean;
};

export type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
};

export const emptyProjectForm: ProjectFormState = {
  title: "",
  category: "Maintenance",
  priority: "Soon",
  status: "Idea",
  executionType: "DIY",
  estimate: "",
  actual: "",
  timing: "",
  owner: "",
  notes: "",
  selectedContractorId: "",
};

export const emptyHistoryRecordForm: HistoryRecordFormState = {
  title: "",
  category: "Maintenance",
  completedDate: "",
  amount: "",
  executionType: "Professional",
  contractor: "",
  notes: "",
};

export const emptyContractorForm = (): ContractorFormState => ({
  id: crypto.randomUUID(),
  name: "",
  trade: "",
  contact: "",
  quotedAmount: "",
  notes: "",
  isSaved: false,
  isExpanded: true,
});

export const emptyAttachmentForm = (): AttachmentFormState => ({
  id: crypto.randomUUID(),
  name: "",
  type: "Receipt",
  notes: "",
  isSaved: false,
  isExpanded: true,
});

export const professionalQuoteStatuses: ProjectStatus[] = ["Idea", "Quoted"];

export const canAddPotentialContractors = (status: ProjectStatus) =>
  professionalQuoteStatuses.includes(status);

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const getProjectBudget = (project: Project) => {
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

export function inferExecutionType(project: Project) {
  return project.owner === "DIY" ? "DIY" : "Professional";
}

export function normalizeProject(project: Project) {
  return {
    ...project,
    executionType: project.executionType ?? inferExecutionType(project),
    contractors: project.contractors ?? [],
    attachments: project.attachments ?? [],
  };
}

export function projectToTimelineEvent(project: Project): TimelineEvent {
  const selectedContractor = project.contractors?.find(
    (contractor) => contractor.id === project.selectedContractorId,
  );
  const amount = project.actual ?? getProjectBudget(project);
  const ownerDetail =
    project.executionType === "DIY"
      ? "DIY"
      : selectedContractor
        ? selectedContractor.name
        : "Professional";

  return {
    id: project.id,
    date: project.timing,
    title: project.title,
    detail: `${project.category} · ${ownerDetail}${
      project.notes ? ` · ${project.notes}` : ""
    }`,
    amount,
    source: "project",
  };
}

export function historyRecordToTimelineEvent(record: HistoryRecord): TimelineEvent {
  const ownerDetail =
    record.executionType === "DIY" ? "DIY" : record.contractor || "Professional";

  return {
    id: record.id,
    date: record.completedDate,
    title: record.title,
    detail: `${record.category} · ${ownerDetail}${
      record.notes ? ` · ${record.notes}` : ""
    }`,
    amount: record.amount,
    source: "record",
  };
}

export function historyRecordToForm(record: HistoryRecord): HistoryRecordFormState {
  return {
    title: record.title,
    category: record.category,
    completedDate: record.completedDate,
    amount: record.amount ? String(record.amount) : "",
    executionType: record.executionType,
    contractor: record.contractor,
    notes: record.notes ?? "",
  };
}

export function attachmentsToForm(attachments: Attachment[] = []): AttachmentFormState[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    notes: attachment.notes ?? "",
    isSaved: true,
    isExpanded: false,
  }));
}

export function savedAttachmentsFromForm(attachments: AttachmentFormState[]): Attachment[] {
  return attachments
    .filter((attachment) => attachment.isSaved && attachment.name.trim())
    .map((attachment) => ({
      id: attachment.id,
      name: attachment.name.trim(),
      type: attachment.type,
      notes: attachment.notes.trim() || undefined,
    }));
}

export function projectToForm(project: Project): ProjectFormState {
  return {
    title: project.title,
    category: project.category,
    priority: project.priority,
    status: project.status,
    executionType: project.executionType,
    estimate: project.estimate ? String(project.estimate) : "",
    actual: project.actual ? String(project.actual) : "",
    timing: project.timing,
    owner: project.owner,
    notes: project.notes ?? "",
    selectedContractorId: project.selectedContractorId ?? "",
  };
}

export function projectContractorsToForm(project: Project): ContractorFormState[] {
  return (project.contractors ?? []).map((contractor) => ({
    id: contractor.id,
    name: contractor.name,
    trade: contractor.trade,
    contact: contractor.contact,
    quotedAmount: contractor.quotedAmount ? String(contractor.quotedAmount) : "",
    notes: contractor.notes ?? "",
    isSaved: true,
    isExpanded: false,
  }));
}
