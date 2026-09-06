import { bulkSetDuplicateStatus, listRecordsByProject } from '../db/repositories/recordRepo';
import { createRequestClient } from '../workers/workerClient';
import type { DedupeCandidate, DedupeWorkerRequest, DedupeWorkerResponse } from '../workers/dedupe.worker';

export interface DedupeRingkasan {
  totalRecord: number;
  totalDuplikatDoi: number;
  totalKandidat: number;
}

function toCandidate(record: { id: string; doi: string | null; judul: string; tahun: number | null; penulis: string[] }): DedupeCandidate {
  return {
    id: record.id,
    doi: record.doi,
    judul: record.judul,
    tahun: record.tahun,
    penulisPertama: record.penulis[0] ?? null,
  };
}

/**
 * Jalankan deduplikasi (DOI lalu Jaro-Winkler) atas seluruh record proyek
 * yang belum berstatus 'duplikat', lalu simpan hasilnya ke IndexedDB.
 * Perhitungan berat berjalan di dedupe.worker (Web Worker).
 */
export async function runDeduplication(projectId: string): Promise<DedupeRingkasan> {
  const allRecords = await listRecordsByProject(projectId);
  const candidates = allRecords.filter((r) => r.statusDuplikat !== 'duplikat').map(toCandidate);

  const worker = new Worker(new URL('../workers/dedupe.worker.ts', import.meta.url), { type: 'module' });
  try {
    const request = createRequestClient<DedupeWorkerRequest, DedupeWorkerResponse>(worker);
    const { updates, ringkasan } = await request({ records: candidates });

    await bulkSetDuplicateStatus(updates);

    return {
      totalRecord: allRecords.length,
      totalDuplikatDoi: ringkasan.totalDuplikatDoi,
      totalKandidat: ringkasan.totalKandidat,
    };
  } finally {
    worker.terminate();
  }
}
