import type { ParseResult } from './normalize';
import { parseCsvRows } from './csvGeneric';
import { applyColumnMapping, detectMapping, type CsvColumnMapping, type CsvFieldCandidates } from './csvColumnMapping';

/** Header umum pada ekspor "Full Record" (CSV/Excel) dari Web of Science. */
export const WOS_CANDIDATES: CsvFieldCandidates = {
  judul: ['Article Title'],
  penulis: ['Authors', 'Author Full Names'],
  tahun: ['Publication Year'],
  jurnal: ['Source Title'],
  doi: ['DOI'],
  abstrak: ['Abstract'],
  kataKunci: ['Author Keywords', 'Keywords Plus'],
  jumlahSitasi: ['Times Cited, WoS Core', 'Times Cited, All Databases'],
  penerbit: ['Publisher'],
};

export function detectWosMapping(headers: string[]): CsvColumnMapping {
  return detectMapping(headers, WOS_CANDIDATES);
}

export function parseWosCsv(text: string, mapping?: CsvColumnMapping): ParseResult {
  const csv = parseCsvRows(text);
  const finalMapping = mapping ?? detectWosMapping(csv.headers);
  return applyColumnMapping(csv, finalMapping);
}
