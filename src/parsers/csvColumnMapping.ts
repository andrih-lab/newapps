import type { ParseIssue, ParseResult, ParsedEntry } from './normalize';
import { extractYear, normalizeAuthorName, splitKeywordList } from './normalize';
import { findColumn, splitSemicolonList, type CsvParseResult } from './csvGeneric';

/** Field kanonik yang bisa dipetakan dari kolom CSV, ditampilkan di dialog pemetaan manual. */
export type CsvTargetField =
  | 'judul'
  | 'penulis'
  | 'tahun'
  | 'jurnal'
  | 'doi'
  | 'abstrak'
  | 'kataKunci'
  | 'jumlahSitasi'
  | 'penerbit';

export type CsvColumnMapping = Record<CsvTargetField, string | null>;

export const CSV_TARGET_FIELDS: CsvTargetField[] = [
  'judul',
  'penulis',
  'tahun',
  'jurnal',
  'doi',
  'abstrak',
  'kataKunci',
  'jumlahSitasi',
  'penerbit',
];

export type CsvFieldCandidates = Record<CsvTargetField, string[]>;

/** Kandidat nama kolom generik, dipakai sebagai fallback terakhir bila format spesifik tidak cocok. */
export const GENERIC_CANDIDATES: CsvFieldCandidates = {
  judul: ['Title', 'Article Title', 'Document Title'],
  penulis: ['Authors', 'Author Full Names', 'Author full names'],
  tahun: ['Year', 'Publication Year'],
  jurnal: ['Source title', 'Source Title', 'Journal'],
  doi: ['DOI'],
  abstrak: ['Abstract'],
  kataKunci: ['Author Keywords', 'Keywords', 'Author keywords'],
  jumlahSitasi: ['Cited by', 'Times Cited, WoS Core', 'Times Cited, All Databases', 'Times Cited'],
  penerbit: ['Publisher'],
};

/** Tebak pemetaan kolom berdasarkan header yang terdeteksi di file, mengikuti prioritas kandidat yang diberikan. */
export function detectMapping(headers: string[], candidates: CsvFieldCandidates = GENERIC_CANDIDATES): CsvColumnMapping {
  const mapping = {} as CsvColumnMapping;
  for (const field of CSV_TARGET_FIELDS) {
    mapping[field] = findColumn(headers, candidates[field]) ?? findColumn(headers, GENERIC_CANDIDATES[field]);
  }
  return mapping;
}

/** Terapkan pemetaan kolom (hasil deteksi otomatis atau koreksi manual pengguna) ke baris CSV. */
export function applyColumnMapping(
  csv: CsvParseResult,
  mapping: CsvColumnMapping,
): ParseResult {
  const issues: ParseIssue[] = [...csv.issues];
  const entries: ParsedEntry[] = [];

  csv.rows.forEach((row, idx) => {
    const posisi = idx + 1;
    const get = (field: CsvTargetField): string => {
      const col = mapping[field];
      return col ? (row[col] ?? '').toString().trim() : '';
    };

    const judul = get('judul');
    if (!judul) {
      issues.push({ posisi, pesan: 'Baris tidak memiliki judul (periksa pemetaan kolom), baris dilewati.' });
      return;
    }

    const penulisRaw = get('penulis');
    const penulis = splitSemicolonList(penulisRaw).map((a) => normalizeAuthorName(a));

    const citRaw = get('jumlahSitasi');
    const jumlahSitasi = citRaw ? Number.parseInt(citRaw, 10) : null;

    entries.push({
      doi: get('doi') || null,
      judul,
      abstrak: get('abstrak'),
      penulis,
      tahun: extractYear(get('tahun')),
      jurnal: get('jurnal'),
      penerbit: get('penerbit'),
      negara: [],
      kataKunci: splitKeywordList(get('kataKunci')),
      jumlahSitasi: Number.isFinite(jumlahSitasi) ? jumlahSitasi : null,
    });
  });

  return { entries, issues, totalMentah: csv.rows.length };
}
