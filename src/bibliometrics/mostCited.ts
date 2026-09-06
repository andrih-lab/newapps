import type { RecordItem } from '../types/record';

export interface CitedRecordSummary {
  id: string;
  judul: string;
  penulis: string[];
  tahun: number | null;
  jurnal: string;
  jumlahSitasi: number;
}

/** Artikel paling banyak disitasi (Bagian 4, Modul 3). */
export function computeMostCited(records: RecordItem[], topN = 20): CitedRecordSummary[] {
  return [...records]
    .sort((a, b) => b.jumlahSitasi - a.jumlahSitasi)
    .slice(0, topN)
    .map((r) => ({
      id: r.id,
      judul: r.judul,
      penulis: r.penulis,
      tahun: r.tahun,
      jurnal: r.jurnal,
      jumlahSitasi: r.jumlahSitasi,
    }));
}
