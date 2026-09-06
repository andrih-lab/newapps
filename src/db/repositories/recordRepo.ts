import { db } from '../db';
import type { RecordItem, StatusDuplikat } from '../../types/record';

export async function bulkAddRecords(records: RecordItem[]): Promise<void> {
  await db.record.bulkAdd(records);
}

export function listRecordsByProject(projectId: string): Promise<RecordItem[]> {
  return db.record.where('projectId').equals(projectId).toArray();
}

export function countRecordsByProject(projectId: string): Promise<number> {
  return db.record.where('projectId').equals(projectId).count();
}

export async function setDuplicateStatus(
  id: string,
  statusDuplikat: StatusDuplikat,
  duplicateOfId: string | null,
  similarityScore: number | null,
): Promise<void> {
  await db.record.update(id, { statusDuplikat, duplicateOfId, similarityScore });
}

export async function bulkSetDuplicateStatus(
  updates: Array<{ id: string; statusDuplikat: StatusDuplikat; duplicateOfId: string | null; similarityScore: number | null }>,
): Promise<void> {
  await db.transaction('rw', db.record, async () => {
    for (const u of updates) {
      await db.record.update(u.id, {
        statusDuplikat: u.statusDuplikat,
        duplicateOfId: u.duplicateOfId,
        similarityScore: u.similarityScore,
      });
    }
  });
}

export function listNonDuplicateRecords(projectId: string): Promise<RecordItem[]> {
  return db.record
    .where('projectId')
    .equals(projectId)
    .filter((r) => r.statusDuplikat !== 'duplikat')
    .toArray();
}

export async function deleteRecord(id: string): Promise<void> {
  await db.record.delete(id);
}
