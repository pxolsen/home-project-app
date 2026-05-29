import { supabase } from "./supabase";
import {
  normalizeProject,
  type Attachment,
  type AttachmentType,
  type ContractorQuote,
  type ExecutionType,
  type HistoryRecord,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
} from "../domain";

export type HomeRecord = {
  id: string;
  name: string;
  address?: string;
  builtYear?: number;
  squareFeet?: number;
  style?: string;
};

type HomeRow = {
  id: string;
  name: string;
  address: string | null;
  built_year: number | null;
  square_feet: number | null;
  style: string | null;
};

type ContractorRow = {
  id: string;
  name: string;
  trade: string;
  contact: string;
  quoted_amount: number | string | null;
  notes: string | null;
};

type AttachmentRow = {
  id: string;
  name: string;
  type: AttachmentType;
  notes: string | null;
};

type ProjectRow = {
  id: string;
  title: string;
  category: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  execution_type: ExecutionType;
  estimate: number | string;
  actual: number | string | null;
  timing: string;
  owner: string;
  notes: string | null;
  selected_contractor_id: string | null;
  contractors?: ContractorRow[];
  attachments?: AttachmentRow[];
};

type HistoryRecordRow = {
  id: string;
  title: string;
  category: string;
  completed_date: string;
  amount: number | string;
  execution_type: ExecutionType;
  contractor: string;
  notes: string | null;
  attachments?: AttachmentRow[];
};

export type RemoteAppData = {
  home: HomeRecord;
  projects: Project[];
  historyRecords: HistoryRecord[];
};

export async function loadRemoteAppData(userId: string): Promise<RemoteAppData> {
  const client = getSupabaseClient();
  const home = await getOrCreateHome(userId);

  const [{ data: projectRows, error: projectsError }, { data: historyRows, error: historyError }] =
    await Promise.all([
      client
        .from("projects")
        .select("*, contractors(*), attachments(*)")
        .eq("home_id", home.id)
        .order("created_at", { ascending: false }),
      client
        .from("history_records")
        .select("*, attachments(*)")
        .eq("home_id", home.id)
        .order("created_at", { ascending: false }),
    ]);

  if (projectsError) {
    throw projectsError;
  }

  if (historyError) {
    throw historyError;
  }

  return {
    home,
    projects: ((projectRows ?? []) as ProjectRow[]).map(rowToProject),
    historyRecords: ((historyRows ?? []) as HistoryRecordRow[]).map(rowToHistoryRecord),
  };
}

export async function saveRemoteProject({
  homeId,
  project,
  userId,
}: {
  homeId: string;
  project: Project;
  userId: string;
}) {
  const client = getSupabaseClient();
  const selectedContractorId =
    project.executionType === "Professional" ? project.selectedContractorId ?? null : null;

  const { error: projectError } = await client.from("projects").upsert({
    id: project.id,
    home_id: homeId,
    title: project.title,
    category: project.category,
    priority: project.priority,
    status: project.status,
    execution_type: project.executionType,
    estimate: project.estimate,
    actual: project.actual ?? null,
    timing: project.timing,
    owner: project.owner,
    notes: project.notes ?? null,
    selected_contractor_id: null,
    created_by: userId,
  });

  if (projectError) {
    throw projectError;
  }

  const { error: contractorDeleteError } = await client
    .from("contractors")
    .delete()
    .eq("project_id", project.id);

  if (contractorDeleteError) {
    throw contractorDeleteError;
  }

  const contractors = project.contractors ?? [];

  if (project.executionType === "Professional" && contractors.length) {
    const { error: contractorInsertError } = await client.from("contractors").insert(
      contractors.map((contractor) => ({
        id: contractor.id,
        project_id: project.id,
        name: contractor.name,
        trade: contractor.trade,
        contact: contractor.contact,
        quoted_amount: contractor.quotedAmount ?? null,
        notes: contractor.notes ?? null,
      })),
    );

    if (contractorInsertError) {
      throw contractorInsertError;
    }
  }

  const { error: selectedContractorError } = await client
    .from("projects")
    .update({ selected_contractor_id: selectedContractorId })
    .eq("id", project.id);

  if (selectedContractorError) {
    throw selectedContractorError;
  }

  await replaceRemoteAttachments({
    attachments: project.attachments ?? [],
    homeId,
    parentId: project.id,
    parentType: "project",
    userId,
  });
}

export async function saveRemoteHistoryRecord({
  homeId,
  record,
  userId,
}: {
  homeId: string;
  record: HistoryRecord;
  userId: string;
}) {
  const client = getSupabaseClient();

  const { error } = await client.from("history_records").upsert({
    id: record.id,
    home_id: homeId,
    title: record.title,
    category: record.category,
    completed_date: record.completedDate,
    amount: record.amount,
    execution_type: record.executionType,
    contractor: record.contractor,
    notes: record.notes ?? null,
    created_by: userId,
  });

  if (error) {
    throw error;
  }

  await replaceRemoteAttachments({
    attachments: record.attachments ?? [],
    homeId,
    parentId: record.id,
    parentType: "history",
    userId,
  });
}

export async function deleteRemoteHistoryRecord(recordId: string) {
  const client = getSupabaseClient();
  const { error } = await client.from("history_records").delete().eq("id", recordId);

  if (error) {
    throw error;
  }
}

async function getOrCreateHome(userId: string): Promise<HomeRecord> {
  const client = getSupabaseClient();
  const { data: homes, error: homesError } = await client
    .from("homes")
    .select("id, name, address, built_year, square_feet, style")
    .order("created_at", { ascending: true })
    .limit(1);

  if (homesError) {
    throw homesError;
  }

  if (homes?.[0]) {
    return rowToHome(homes[0] as HomeRow);
  }

  const { data: home, error: createHomeError } = await client
    .from("homes")
    .insert({
      name: "My Home",
      created_by: userId,
    })
    .select("id, name, address, built_year, square_feet, style")
    .single();

  if (createHomeError) {
    throw createHomeError;
  }

  const { error: membershipError } = await client.from("home_members").insert({
    home_id: home.id,
    user_id: userId,
    role: "owner",
  });

  if (membershipError) {
    throw membershipError;
  }

  return rowToHome(home as HomeRow);
}

async function replaceRemoteAttachments({
  attachments,
  homeId,
  parentId,
  parentType,
  userId,
}: {
  attachments: Attachment[];
  homeId: string;
  parentId: string;
  parentType: "project" | "history";
  userId: string;
}) {
  const client = getSupabaseClient();
  const parentColumn = parentType === "project" ? "project_id" : "history_record_id";

  const { error: deleteError } = await client
    .from("attachments")
    .delete()
    .eq(parentColumn, parentId);

  if (deleteError) {
    throw deleteError;
  }

  if (!attachments.length) {
    return;
  }

  const { error: insertError } = await client.from("attachments").insert(
    attachments.map((attachment) => ({
      id: attachment.id,
      home_id: homeId,
      project_id: parentType === "project" ? parentId : null,
      history_record_id: parentType === "history" ? parentId : null,
      name: attachment.name,
      type: attachment.type,
      notes: attachment.notes ?? null,
      created_by: userId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function rowToHome(row: HomeRow): HomeRecord {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? undefined,
    builtYear: row.built_year ?? undefined,
    squareFeet: row.square_feet ?? undefined,
    style: row.style ?? undefined,
  };
}

function rowToProject(row: ProjectRow): Project {
  return normalizeProject({
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    status: row.status,
    executionType: row.execution_type,
    estimate: toNumber(row.estimate),
    actual: row.actual === null ? undefined : toNumber(row.actual),
    timing: row.timing,
    owner: row.owner,
    notes: row.notes ?? undefined,
    contractors: (row.contractors ?? []).map(rowToContractor),
    selectedContractorId: row.selected_contractor_id ?? undefined,
    attachments: (row.attachments ?? []).map(rowToAttachment),
  });
}

function rowToContractor(row: ContractorRow): ContractorQuote {
  return {
    id: row.id,
    name: row.name,
    trade: row.trade,
    contact: row.contact,
    quotedAmount: row.quoted_amount === null ? undefined : toNumber(row.quoted_amount),
    notes: row.notes ?? undefined,
  };
}

function rowToHistoryRecord(row: HistoryRecordRow): HistoryRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    completedDate: row.completed_date,
    amount: toNumber(row.amount),
    executionType: row.execution_type,
    contractor: row.contractor,
    notes: row.notes ?? undefined,
    attachments: (row.attachments ?? []).map(rowToAttachment),
  };
}

function rowToAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    notes: row.notes ?? undefined,
  };
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}
