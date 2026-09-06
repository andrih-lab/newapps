import { db } from '../db';
import type { Extraction, KutipanVerbatim } from '../../types/record';

export function getExtractionByRecordId(recordId: string): Promise<Extraction | undefined> {
  return db.extraction.where('recordId').equals(recordId).first();
}

/** Buat atau perbarui Extraction untuk satu record (Bagian 5: id, recordId, kolom{}, kutipan[]). Autosave. */
export async function upsertExtraction(
  recordId: string,
  kolom: Record<string, string>,
  kutipan: KutipanVerbatim[],
): Promise<Extraction> {
  const existing = await getExtractionByRecordId(recordId);
  if (existing) {
    const updated: Extraction = { ...existing, kolom, kutipan };
    await db.extraction.put(updated);
    return updated;
  }
  const created: Extraction = { id: crypto.randomUUID(), recordId, kolom, kutipan };
  await db.extraction.add(created);
  return created;
}

export function listExtractionsByRecordIds(recordIds: string[]): Promise<Extraction[]> {
  if (recordIds.length === 0) return Promise.resolve([]);
  return db.extraction.where('recordId').anyOf(recordIds).toArray();
}
