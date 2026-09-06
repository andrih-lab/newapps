import { db } from '../db';
import type { Project, SearchQuery } from '../../types/project';
import type { Criterion, Extraction, RecordItem, ScreeningLog } from '../../types/record';

const BACKUP_FORMAT_VERSION = 1;

/** Cadangan lengkap satu proyek (Bagian 4, Modul 8) — bisa diunduh sebagai JSON dan dipulihkan di perangkat lain. */
export interface ProjectBackup {
  formatVersion: number;
  diekspor: string; // ISO datetime
  project: Project;
  searchQueries: SearchQuery[];
  records: RecordItem[];
  criteria: Criterion[];
  extractions: Extraction[];
  screeningLogs: ScreeningLog[];
}

export async function exportProjectBackup(projectId: string): Promise<ProjectBackup> {
  const project = await db.project.get(projectId);
  if (!project) throw new Error('Proyek tidak ditemukan.');

  const [searchQueries, records, criteria] = await Promise.all([
    db.searchQuery.where('projectId').equals(projectId).toArray(),
    db.record.where('projectId').equals(projectId).toArray(),
    db.criterion.where('projectId').equals(projectId).toArray(),
  ]);
  const recordIds = records.map((r) => r.id);
  const [extractions, screeningLogs] = await Promise.all([
    recordIds.length > 0 ? db.extraction.where('recordId').anyOf(recordIds).toArray() : Promise.resolve([]),
    recordIds.length > 0 ? db.screeningLog.where('recordId').anyOf(recordIds).toArray() : Promise.resolve([]),
  ]);

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    diekspor: new Date().toISOString(),
    project,
    searchQueries,
    records,
    criteria,
    extractions,
    screeningLogs,
  };
}

export function isValidProjectBackup(data: unknown): data is ProjectBackup {
  if (!data || typeof data !== 'object') return false;
  const b = data as Partial<ProjectBackup>;
  return (
    typeof b.formatVersion === 'number' &&
    !!b.project &&
    Array.isArray(b.searchQueries) &&
    Array.isArray(b.records) &&
    Array.isArray(b.criteria) &&
    Array.isArray(b.extractions) &&
    Array.isArray(b.screeningLogs)
  );
}

/**
 * Pulihkan cadangan sebagai PROYEK BARU (id-id di-generate ulang & di-remap agar tidak
 * bentrok dengan data yang sudah ada di perangkat tujuan) — Bagian 4, Modul 8: "pindah perangkat".
 */
export async function importProjectBackup(backup: ProjectBackup): Promise<Project> {
  const now = new Date().toISOString();
  const newProjectId = crypto.randomUUID();
  const project: Project = { ...backup.project, id: newProjectId, dibuat: now, diubah: now };

  const recordIdMap = new Map<string, string>();
  const records = backup.records.map((r) => {
    const newId = crypto.randomUUID();
    recordIdMap.set(r.id, newId);
    return { ...r, id: newId, projectId: newProjectId };
  });
  for (const r of records) {
    r.duplicateOfId = r.duplicateOfId ? (recordIdMap.get(r.duplicateOfId) ?? null) : null;
  }

  const searchQueries = backup.searchQueries.map((q) => ({ ...q, id: crypto.randomUUID(), projectId: newProjectId }));
  const criteria = backup.criteria.map((c) => ({ ...c, id: crypto.randomUUID(), projectId: newProjectId }));
  const extractions = backup.extractions
    .filter((e) => recordIdMap.has(e.recordId))
    .map((e) => ({ ...e, id: crypto.randomUUID(), recordId: recordIdMap.get(e.recordId) as string }));
  const screeningLogs = backup.screeningLogs
    .filter((l) => recordIdMap.has(l.recordId))
    .map((l) => ({ ...l, id: crypto.randomUUID(), recordId: recordIdMap.get(l.recordId) as string }));

  const tables = [db.project, db.searchQuery, db.record, db.criterion, db.extraction, db.screeningLog];
  await db.transaction('rw', tables, async () => {
    await db.project.add(project);
    if (searchQueries.length > 0) await db.searchQuery.bulkAdd(searchQueries);
    if (records.length > 0) await db.record.bulkAdd(records);
    if (criteria.length > 0) await db.criterion.bulkAdd(criteria);
    if (extractions.length > 0) await db.extraction.bulkAdd(extractions);
    if (screeningLogs.length > 0) await db.screeningLog.bulkAdd(screeningLogs);
  });

  return project;
}
