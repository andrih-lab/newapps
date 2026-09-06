/** Definisi satu kolom matriks ekstraksi (Bagian 4, Modul 5 — "kolom dapat dikustomisasi"). */
export interface MatrixColumnDef {
  key: string;
  label: string;
}

/**
 * Satu proyek SLR/bibliometrik milik pengguna.
 * `kolomEkstraksi` di luar Bagian 5, opsional (proyek lama tanpa field ini
 * memakai preset bawaan Modul 5 — lihat extraction/defaultColumns.ts).
 */
export interface Project {
  id: string;
  nama: string;
  pertanyaanPenelitian: string;
  dibuat: string; // ISO datetime
  diubah: string; // ISO datetime
  kolomEkstraksi?: MatrixColumnDef[];
}

/** Sumber data yang bisa dipakai untuk pencarian atau asal impor. */
export type SumberData =
  | 'openalex'
  | 'crossref'
  | 'semantic_scholar'
  | 'europe_pmc'
  | 'bibtex'
  | 'ris'
  | 'csv_scopus'
  | 'csv_wos'
  | 'csv_generik'
  | 'manual';

/** Filter pencarian yang dipakai saat memanggil sumber eksternal (mis. OpenAlex). */
export interface FilterPencarian {
  tahunMulai?: number;
  tahunAkhir?: number;
  jenisDokumen?: string[];
  bahasa?: string[];
}

/**
 * Catatan setiap pencarian/impor yang dilakukan pada sebuah proyek.
 * Wajib disimpan karena menjadi bahan bab Metode (Bagian 4, Modul 1a).
 */
export interface SearchQuery {
  id: string;
  projectId: string;
  sumber: SumberData;
  stringQuery: string;
  filter: FilterPencarian;
  tanggal: string; // ISO datetime saat pencarian/impor dijalankan
  jumlahHasil: number;
}
