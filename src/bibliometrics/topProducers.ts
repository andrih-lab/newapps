import type { RecordItem } from '../types/record';

export interface ProducerCount {
  nama: string;
  jumlah: number;
}

function countByField(records: RecordItem[], getItems: (r: RecordItem) => string[]): ProducerCount[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const unique = new Set(getItems(r).map((s) => s.trim()).filter(Boolean));
    for (const item of unique) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

/** Penulis, institusi, negara, dan jurnal paling produktif (Bagian 4, Modul 3). */
export function computeTopAuthors(records: RecordItem[], topN = 20): ProducerCount[] {
  return countByField(records, (r) => r.penulis).slice(0, topN);
}

export function computeTopInstitutions(records: RecordItem[], topN = 20): ProducerCount[] {
  return countByField(records, (r) => r.institusi).slice(0, topN);
}

export function computeTopCountries(records: RecordItem[], topN = 20): ProducerCount[] {
  return countByField(records, (r) => r.negara).slice(0, topN);
}

export function computeTopJournals(records: RecordItem[], topN = 20): ProducerCount[] {
  return countByField(records, (r) => (r.jurnal ? [r.jurnal] : [])).slice(0, topN);
}
