import type { MatrixColumnDef } from '../types/project';

/** Kolom bawaan matriks ekstraksi (Bagian 4, Modul 5). Proyek bisa menambah/menghapus/mengganti nama. */
export const DEFAULT_MATRIX_COLUMNS: MatrixColumnDef[] = [
  { key: 'penulis', label: 'Penulis' },
  { key: 'tahun', label: 'Tahun' },
  { key: 'negaraLokasi', label: 'Negara/Lokasi' },
  { key: 'desainPenelitian', label: 'Desain Penelitian' },
  { key: 'ukuranSampel', label: 'Ukuran Sampel' },
  { key: 'variabel', label: 'Variabel' },
  { key: 'metodeAnalisis', label: 'Metode Analisis' },
  { key: 'temuanUtama', label: 'Temuan Utama' },
  { key: 'keterbatasan', label: 'Keterbatasan' },
];

export function getMatrixColumns(kolomEkstraksi: MatrixColumnDef[] | undefined): MatrixColumnDef[] {
  return kolomEkstraksi && kolomEkstraksi.length > 0 ? kolomEkstraksi : DEFAULT_MATRIX_COLUMNS;
}
