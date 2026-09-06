import type { ParseResult } from './normalize';
import { parseCsvRows } from './csvGeneric';
import { applyColumnMapping, detectMapping, type CsvColumnMapping, type CsvFieldCandidates } from './csvColumnMapping';

/** Header umum pada ekspor CSV Scopus ("Export > CSV" dari Scopus Search Results). */
export const SCOPUS_CANDIDATES: CsvFieldCandidates = {
  judul: ['Title'],
  penulis: ['Authors', 'Author full names'],
  tahun: ['Year'],
  jurnal: ['Source title'],
  doi: ['DOI'],
  abstrak: ['Abstract'],
  kataKunci: ['Author Keywords', 'Index Keywords'],
  jumlahSitasi: ['Cited by'],
  penerbit: ['Publisher'],
};

export function detectScopusMapping(headers: string[]): CsvColumnMapping {
  return detectMapping(headers, SCOPUS_CANDIDATES);
}

export function parseScopusCsv(text: string, mapping?: CsvColumnMapping): ParseResult {
  const csv = parseCsvRows(text);
  const finalMapping = mapping ?? detectScopusMapping(csv.headers);
  return applyColumnMapping(csv, finalMapping);
}
