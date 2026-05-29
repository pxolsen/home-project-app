import { initialHistoryRecords, initialProjects } from "./data";
import { normalizeProject, type HistoryRecord, type Project } from "./domain";

export const PROJECTS_STORAGE_KEY = "home-project-app.projects";
export const HISTORY_RECORDS_STORAGE_KEY = "home-project-app.history-records";

export function loadStoredProjects() {
  if (typeof window === "undefined") {
    return initialProjects;
  }

  const storedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!storedProjects) {
    return initialProjects;
  }

  try {
    const parsedProjects = JSON.parse(storedProjects) as unknown;
    return Array.isArray(parsedProjects)
      ? (parsedProjects as Project[]).map(normalizeProject)
      : initialProjects;
  } catch {
    return initialProjects;
  }
}

export function loadStoredHistoryRecords() {
  if (typeof window === "undefined") {
    return initialHistoryRecords;
  }

  const storedRecords = window.localStorage.getItem(HISTORY_RECORDS_STORAGE_KEY);
  if (!storedRecords) {
    return initialHistoryRecords;
  }

  try {
    const parsedRecords = JSON.parse(storedRecords) as unknown;
    return Array.isArray(parsedRecords)
      ? (parsedRecords as HistoryRecord[])
      : initialHistoryRecords;
  } catch {
    return initialHistoryRecords;
  }
}
