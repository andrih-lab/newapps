import type { MatrixColumnDef } from '../types/project';
import type { RecordItem } from '../types/record';
import { toCsv } from '../lib/exportCsv';

/**
 * Template CSV matriks ekstraksi (Bagian 4, Modul 5 — alternatif pengisian
 * di luar aplikasi). Excel/Google Sheets bisa membuka & menyimpan CSV
 * langsung, jadi format ini dipilih daripada .xlsx asli (lihat catatan
 * keamanan di README perihal dependency SheetJS/xlsx).
 */
export function generateExtractionTemplate(records: RecordItem[], columns: MatrixColumnDef[]): string {
  const rows = records.map((r) => {
    const row: Record<string, unknown> = { judul: r.judul };
    for (const col of columns) row[col.key] = '';
    row.kutipanVerbatim = '';
    return row;
  });
  return toCsv(rows, ['judul', ...columns.map((c) => c.key), 'kutipanVerbatim']);
}
