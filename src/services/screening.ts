import { listNonDuplicateRecords, bulkSetSkorRelevansi, setScreeningDecision, resetScreeningDecision } from '../db/repositories/recordRepo';
import { addScreeningLog, deleteLatestScreeningLog, listScreeningLogsByRecordIds } from '../db/repositories/screeningLogRepo';
import { listCriteria } from '../db/repositories/criterionRepo';
import { createRequestClient } from '../workers/workerClient';
import type { ScreeningWorkerRequest, ScreeningWorkerResponse } from '../workers/screening.worker';
import type { Project } from '../types/project';
import type { KeputusanSkrining, ScreeningLog } from '../types/record';
import type { Keputusan, ScreeningDoc } from '../screening';

/** Gabungkan pertanyaan penelitian + kriteria inklusi jadi satu teks query untuk kemiripan TF-IDF. */
function buildQueryText(project: Project, criteriaInklusi: Array<{ label: string; deskripsi: string }>): string {
  const bagian = [project.pertanyaanPenelitian, ...criteriaInklusi.flatMap((c) => [c.label, c.deskripsi])];
  return bagian.filter(Boolean).join(' ');
}

export interface RetrainResult {
  modeAktif: 'awal' | 'active_learning';
  totalDinilai: number;
  totalBelum: number;
}

/**
 * Latih ulang (bila fase active learning) atau susun ulang urutan awal, lalu simpan skor
 * relevansi terbaru ke setiap record yang belum dinilai (Bagian 4, Modul 4b).
 */
export async function retrainScreening(project: Project): Promise<RetrainResult> {
  const records = await listNonDuplicateRecords(project.id);
  const recordIds = records.map((r) => r.id);
  const logs = await listScreeningLogsByRecordIds(recordIds);

  const docs: ScreeningDoc[] = records.map((r) => ({ id: r.id, judul: r.judul, abstrak: r.abstrak }));
  const keputusan: Keputusan[] = logsToLatestDecisions(logs);
  const criteria = await listCriteria(project.id);
  const queryText = buildQueryText(
    project,
    criteria.filter((c) => c.tipe === 'inklusi'),
  );

  const worker = new Worker(new URL('../workers/screening.worker.ts', import.meta.url), { type: 'module' });
  try {
    const request = createRequestClient<ScreeningWorkerRequest, ScreeningWorkerResponse>(worker);
    const { skor, modeAktif } = await request({ docs, keputusan, queryText });
    await bulkSetSkorRelevansi(new Map(skor));

    return {
      modeAktif,
      totalDinilai: keputusan.length,
      totalBelum: records.length - keputusan.length,
    };
  } finally {
    worker.terminate();
  }
}

/** Ambil keputusan TERAKHIR per record dari log (record bisa dinilai ulang setelah undo). */
function logsToLatestDecisions(logs: ScreeningLog[]): Keputusan[] {
  const byRecord = new Map<string, ScreeningLog>();
  for (const log of logs) byRecord.set(log.recordId, log); // logs terurut oleh waktu, entri terakhir menang
  return Array.from(byRecord.values()).map((l) => ({ recordId: l.recordId, keputusan: l.keputusan }));
}

/** Simpan satu keputusan skrining (autosave seketika ke IndexedDB — Catatan Bagian 9). */
export async function submitScreeningDecision(
  recordId: string,
  keputusan: KeputusanSkrining,
  labelEksklusi: string | null,
  penilai: string | null,
): Promise<void> {
  await setScreeningDecision(recordId, keputusan, labelEksklusi, penilai);
  await addScreeningLog(recordId, keputusan, keputusan === 'tolak' ? labelEksklusi : null, penilai);
}

/** Batalkan keputusan terakhir pada satu record (tombol mundur '←'). */
export async function undoScreeningDecision(recordId: string): Promise<void> {
  await resetScreeningDecision(recordId);
  await deleteLatestScreeningLog(recordId);
}
