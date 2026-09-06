import { db } from '../db';
import type { KeputusanSkrining, RecordItem, StatusDuplikat, StatusSkrining } from '../../types/record';

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

/** Record non-duplikat yang belum dinilai, diurutkan menurun berdasarkan skorRelevansi (Modul 4b/4c). */
export async function getNextForScreening(projectId: string): Promise<RecordItem | undefined> {
  const belum = await db.record
    .where('projectId')
    .equals(projectId)
    .filter((r) => r.statusDuplikat !== 'duplikat' && r.statusSkrining === 'belum')
    .toArray();
  belum.sort((a, b) => (b.skorRelevansi ?? -Infinity) - (a.skorRelevansi ?? -Infinity));
  return belum[0];
}

export async function bulkSetSkorRelevansi(scores: Map<string, number>): Promise<void> {
  await db.transaction('rw', db.record, async () => {
    for (const [id, skor] of scores) {
      await db.record.update(id, { skorRelevansi: skor });
    }
  });
}

const keputusanToStatus: Record<KeputusanSkrining, StatusSkrining> = {
  masuk: 'termasuk',
  tolak: 'dikecualikan',
  ragu: 'ragu',
};

export async function setScreeningDecision(
  id: string,
  keputusan: KeputusanSkrining,
  labelEksklusi: string | null,
  penilai: string | null,
): Promise<void> {
  await db.record.update(id, {
    statusSkrining: keputusanToStatus[keputusan],
    labelEksklusi: keputusan === 'tolak' ? labelEksklusi : null,
    tanggalKeputusan: new Date().toISOString(),
    penilai,
  });
}

export async function resetScreeningDecision(id: string): Promise<void> {
  await db.record.update(id, {
    statusSkrining: 'belum',
    labelEksklusi: null,
    tanggalKeputusan: null,
  });
}

/** Record yang lolos skrining abstrak ("termasuk") — inilah cakupan Modul 5 (full teks). */
export function listRecordsForExtraction(projectId: string): Promise<RecordItem[]> {
  return db.record
    .where('projectId')
    .equals(projectId)
    .filter((r) => r.statusDuplikat !== 'duplikat' && r.statusSkrining === 'termasuk')
    .toArray();
}

export async function setPdfInfo(id: string, pdfFileName: string, pdfTeksEkstraksi: string): Promise<void> {
  await db.record.update(id, { pdfFileName, pdfTeksEkstraksi });
}

const fullTextKeputusanToStatus: Record<'masuk' | 'tolak', StatusSkrining> = {
  masuk: 'termasuk',
  tolak: 'dikecualikan',
};

/** Keputusan kelayakan full teks, dicatat terpisah dari skrining abstrak (Bagian 4, Modul 5 — untuk PRISMA). */
export async function setFullTextDecision(
  id: string,
  keputusan: 'masuk' | 'tolak',
  labelEksklusiFullText: string | null,
): Promise<void> {
  await db.record.update(id, {
    statusFullText: fullTextKeputusanToStatus[keputusan],
    labelEksklusiFullText: keputusan === 'tolak' ? labelEksklusiFullText : null,
    tanggalKeputusanFullText: new Date().toISOString(),
  });
}

export async function resetFullTextDecision(id: string): Promise<void> {
  await db.record.update(id, {
    statusFullText: 'belum',
    labelEksklusiFullText: null,
    tanggalKeputusanFullText: null,
  });
}
