import { parseCsvRows } from '../parsers/csvGeneric';
import { jaroWinklerSimilarity } from '../lib/stringSimilarity';
import type { KutipanVerbatim, RecordItem } from '../types/record';
import type { MatrixColumnDef } from '../types/project';

export interface ImportRowResult {
  posisi: number;
  judulDiCsv: string;
  record: RecordItem | null;
  skorKemiripan: number;
  kolom: Record<string, string>;
  kutipan: KutipanVerbatim[];
  issues: string[];
}

/** Ambang kemiripan judul untuk mencocokkan baris CSV ke record (Bagian 4, Modul 5: "mencocokkan judul"). */
const TITLE_MATCH_THRESHOLD = 0.85;

/** Format sel "kutipanVerbatim": "teks (hal. N); teks lain (hal. M)". */
function parseKutipanCell(raw: string | undefined): KutipanVerbatim[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(';')
    .map((entry): KutipanVerbatim | null => {
      const trimmed = entry.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^(.*)\(hal\.?\s*(\d+)\)\s*$/i);
      if (match) return { teks: match[1].trim(), halaman: Number(match[2]) };
      return { teks: trimmed, halaman: null };
    })
    .filter((k): k is KutipanVerbatim => k !== null && k.teks.length > 0);
}

/**
 * Validasi file CSV template yang sudah diisi pengguna di luar aplikasi
 * (Bagian 4, Modul 5): cocokkan judul ke artikel yang lolos skrining
 * (Jaro-Winkler, sama seperti Modul 2), lalu periksa kelengkapan kolom.
 */
export function validateExtractionImport(
  csvText: string,
  records: RecordItem[],
  columns: MatrixColumnDef[],
): ImportRowResult[] {
  const { rows } = parseCsvRows(csvText);

  return rows.map((row, idx) => {
    const judulDiCsv = (row.judul ?? '').trim();
    const issues: string[] = [];

    let best: { record: RecordItem; skor: number } | null = null;
    if (judulDiCsv) {
      for (const r of records) {
        const skor = jaroWinklerSimilarity(judulDiCsv, r.judul);
        if (!best || skor > best.skor) best = { record: r, skor };
      }
    }

    const record = best && best.skor >= TITLE_MATCH_THRESHOLD ? best.record : null;
    if (!judulDiCsv) {
      issues.push('Kolom judul kosong.');
    } else if (!record) {
      const persen = best ? (best.skor * 100).toFixed(0) : '0';
      issues.push(`Judul tidak cocok dengan artikel manapun yang lolos skrining (kemiripan tertinggi: ${persen}%).`);
    }

    const kolom: Record<string, string> = {};
    for (const col of columns) {
      const value = (row[col.key] ?? '').trim();
      kolom[col.key] = value;
      if (!value) issues.push(`Kolom "${col.label}" kosong.`);
    }

    const kutipan = parseKutipanCell(row.kutipanVerbatim);
    if (kutipan.length === 0) issues.push('Belum ada kutipan verbatim.');

    return {
      posisi: idx + 1,
      judulDiCsv,
      record,
      skorKemiripan: best?.skor ?? 0,
      kolom,
      kutipan,
      issues,
    };
  });
}
