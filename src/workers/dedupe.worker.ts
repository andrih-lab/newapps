import { jaroWinklerSimilarity } from '../lib/stringSimilarity';
import type { StatusDuplikat } from '../types/record';
import { handleWorkerRequests } from './workerClient';

/** Ambang batas default sesuai Bagian 4 Modul 2 (~0.90) — dikutip juga di halaman metodologi. */
export const DEFAULT_TITLE_THRESHOLD = 0.9;
/** Ambang kemiripan nama penulis pertama untuk mengonfirmasi kandidat duplikat tahap 2. */
export const DEFAULT_AUTHOR_THRESHOLD = 0.7;

export interface DedupeCandidate {
  id: string;
  /** DOI yang sudah dinormalisasi (lib/doi.ts), null bila tidak ada. */
  doi: string | null;
  judul: string;
  tahun: number | null;
  /** Nama penulis pertama, dipakai sebagai konfirmasi tambahan tahap 2. */
  penulisPertama: string | null;
}

export interface DedupeUpdate {
  id: string;
  statusDuplikat: StatusDuplikat;
  duplicateOfId: string | null;
  similarityScore: number | null;
}

export interface DedupeWorkerRequest {
  records: DedupeCandidate[];
  ambangJudul?: number;
  ambangPenulis?: number;
}

export interface DedupeWorkerResponse {
  updates: DedupeUpdate[];
  ringkasan: {
    totalDuplikatDoi: number;
    totalKandidat: number;
  };
}

/**
 * Tahap 1: cocokkan DOI (sudah dinormalisasi oleh pemanggil).
 * Tahap 2: kemiripan judul Jaro-Winkler >= ambangJudul, dikonfirmasi dengan
 * kesamaan tahun (persis) dan kemiripan nama penulis pertama >= ambangPenulis.
 * Sesuai Bagian 4, Modul 2.
 */
export function computeDuplicates(
  records: DedupeCandidate[],
  ambangJudul: number = DEFAULT_TITLE_THRESHOLD,
  ambangPenulis: number = DEFAULT_AUTHOR_THRESHOLD,
): DedupeWorkerResponse {
  const updates: DedupeUpdate[] = [];
  const removedByDoi = new Set<string>();

  // Tahap 1: DOI
  const doiGroups = new Map<string, DedupeCandidate[]>();
  for (const r of records) {
    if (!r.doi) continue;
    const list = doiGroups.get(r.doi) ?? [];
    list.push(r);
    doiGroups.set(r.doi, list);
  }

  let totalDuplikatDoi = 0;
  for (const group of doiGroups.values()) {
    if (group.length < 2) continue;
    const canonical = group[0];
    for (let i = 1; i < group.length; i++) {
      updates.push({
        id: group[i].id,
        statusDuplikat: 'duplikat',
        duplicateOfId: canonical.id,
        similarityScore: 1,
      });
      removedByDoi.add(group[i].id);
      totalDuplikatDoi++;
    }
  }

  // Tahap 2: Jaro-Winkler judul, dikelompokkan per tahun agar tidak O(n^2) global.
  // Record tanpa tahun dilewati karena tidak bisa dikonfirmasi sesuai kriteria.
  const remaining = records.filter((r) => !removedByDoi.has(r.id) && r.tahun != null);
  const buckets = new Map<number, DedupeCandidate[]>();
  for (const r of remaining) {
    const bucket = buckets.get(r.tahun as number) ?? [];
    bucket.push(r);
    buckets.set(r.tahun as number, bucket);
  }

  let totalKandidat = 0;
  for (const bucket of buckets.values()) {
    const kept: DedupeCandidate[] = [];
    for (const r of bucket) {
      let best: { canonical: DedupeCandidate; score: number } | null = null;
      for (const k of kept) {
        const titleScore = jaroWinklerSimilarity(r.judul, k.judul);
        if (titleScore < ambangJudul) continue;
        if (!r.penulisPertama || !k.penulisPertama) continue;
        const authorScore = jaroWinklerSimilarity(r.penulisPertama, k.penulisPertama);
        if (authorScore < ambangPenulis) continue;
        if (!best || titleScore > best.score) {
          best = { canonical: k, score: titleScore };
        }
      }
      if (best) {
        updates.push({
          id: r.id,
          statusDuplikat: 'kandidat',
          duplicateOfId: best.canonical.id,
          similarityScore: best.score,
        });
        totalKandidat++;
      } else {
        kept.push(r);
      }
    }
  }

  return { updates, ringkasan: { totalDuplikatDoi, totalKandidat } };
}

handleWorkerRequests<DedupeWorkerRequest, DedupeWorkerResponse>((payload) => {
  return computeDuplicates(payload.records, payload.ambangJudul, payload.ambangPenulis);
});
