/**
 * Definisi tabel Dexie sesuai model data Bagian 5 dokumen rancang-bangun.
 * String indeks Dexie hanya mendaftarkan field yang dipakai untuk lookup/query;
 * field lain tetap tersimpan di setiap record meski tidak diindeks.
 */
export const DB_NAME = 'slr_bibliometrik_db';

export const DB_SCHEMA_V1 = {
  project: 'id, nama, dibuat, diubah',
  searchQuery: 'id, projectId, sumber, tanggal',
  record: 'id, projectId, doi, tahun, sumber, statusDuplikat, statusSkrining',
  criterion: 'id, projectId, tipe',
  extraction: 'id, recordId',
  screeningLog: 'id, recordId, waktu',
} as const;
