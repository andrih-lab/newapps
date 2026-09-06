import type { RecordItem } from '../types/record';

export interface NetworkNode {
  id: string;
  label: string;
  /** Jumlah kemunculan (frekuensi) item ini di seluruh korpus. */
  weight: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  /** Jumlah record tempat source & target sama-sama muncul. */
  weight: number;
}

export interface NetworkResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

const EDGE_KEY_SEPARATOR = '␟'; // karakter kontrol Unicode, aman dari isi kata kunci/nama asli

/**
 * Bangun jaringan co-occurrence generik: dua item terhubung bila muncul
 * bersama di record yang sama. Dipakai untuk co-word kata kunci maupun
 * co-authorship penulis/negara (Bagian 4, Modul 3).
 *
 * Dibatasi ke `topN` item terfrekuensi agar graf tetap terbaca.
 */
export function buildCooccurrenceNetwork(
  records: RecordItem[],
  getItems: (r: RecordItem) => string[],
  topN = 50,
): NetworkResult {
  const freq = new Map<string, number>();
  for (const r of records) {
    const unique = new Set(
      getItems(r)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    for (const item of unique) {
      freq.set(item, (freq.get(item) ?? 0) + 1);
    }
  }

  const top = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([item]) => item);
  const topSet = new Set(top);

  const edgeMap = new Map<string, number>();
  for (const r of records) {
    const unique = Array.from(
      new Set(
        getItems(r)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => topSet.has(s)),
      ),
    );
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const pair = [unique[i], unique[j]].sort();
        const key = pair.join(EDGE_KEY_SEPARATOR);
        edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
      }
    }
  }

  const nodes: NetworkNode[] = top.map((id) => ({ id, label: id, weight: freq.get(id) as number }));
  const edges: NetworkEdge[] = Array.from(edgeMap.entries()).map(([key, weight]) => {
    const [source, target] = key.split(EDGE_KEY_SEPARATOR);
    return { source, target, weight };
  });

  return { nodes, edges };
}
