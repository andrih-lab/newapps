import type { SumberData } from './project';

export type StatusDuplikat = 'unik' | 'kandidat' | 'duplikat';

export type StatusSkrining = 'belum' | 'termasuk' | 'dikecualikan' | 'ragu';

/**
 * Record kanonik satu artikel/dokumen di dalam proyek.
 * Sesuai Bagian 5 dokumen rancang-bangun, dengan beberapa field tambahan
 * (ditandai di bawah) yang dibutuhkan pipeline impor & deduplikasi.
 */
export interface RecordItem {
  id: string;
  projectId: string;
  doi: string | null;
  judul: string;
  abstrak: string;
  penulis: string[];
  tahun: number | null;
  jurnal: string;
  penerbit: string;
  negara: string[];
  /** Tambahan di luar Bagian 5: dibutuhkan Modul 3 untuk "institusi paling produktif". Terisi dari OpenAlex, kosong dari BibTeX/RIS/CSV. */
  institusi: string[];
  kataKunci: string[];
  jumlahSitasi: number;
  sumber: SumberData;

  statusDuplikat: StatusDuplikat;
  statusSkrining: StatusSkrining;
  labelEksklusi: string | null;
  catatan: string;
  skorRelevansi: number | null;
  tanggalKeputusan: string | null;
  penilai: string | null;

  // --- Tambahan di luar Bagian 5, dibutuhkan untuk pipeline impor & dedup ---
  /** id record "kanonik" bila status ini adalah duplikat dari record lain. */
  duplicateOfId: string | null;
  /** skor kemiripan Jaro-Winkler terhadap duplicateOfId, untuk audit. */
  similarityScore: number | null;
  /** nama file asal saat diimpor dari BibTeX/RIS/CSV. */
  sourceFile: string | null;
  /** waktu record ini masuk ke proyek. */
  diimporPada: string; // ISO datetime
}

export type TipeKriteria = 'inklusi' | 'eksklusi';

export interface Criterion {
  id: string;
  projectId: string;
  tipe: TipeKriteria;
  label: string;
  deskripsi: string;
}

export interface KutipanVerbatim {
  teks: string;
  halaman: number | null;
}

export interface Extraction {
  id: string;
  recordId: string;
  kolom: Record<string, string>;
  kutipan: KutipanVerbatim[];
}

export type KeputusanSkrining = 'masuk' | 'tolak' | 'ragu';

export interface ScreeningLog {
  id: string;
  recordId: string;
  keputusan: KeputusanSkrining;
  alasan: string | null;
  waktu: string; // ISO datetime
  penilai: string | null;
}
