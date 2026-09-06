import type { ParseResult } from './normalize';
import { parseBibtex } from './bibtex';
import { parseRis } from './ris';
import { parseScopusCsv } from './csvScopus';
import { parseWosCsv } from './csvWos';
import { parseCsvRows } from './csvGeneric';
import { applyColumnMapping, detectMapping, type CsvColumnMapping } from './csvColumnMapping';
import type { SumberData } from '../types/project';

export type FormatFile = 'bibtex' | 'ris' | 'csv_scopus' | 'csv_wos' | 'csv_generik';

export function detectFormatFromFilename(filename: string): FormatFile | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.bib')) return 'bibtex';
  if (lower.endsWith('.ris')) return 'ris';
  if (lower.endsWith('.csv')) return 'csv_generik'; // format CSV spesifik ditentukan pengguna di UI
  return null;
}

export function formatToSumber(format: FormatFile): SumberData {
  switch (format) {
    case 'bibtex':
      return 'bibtex';
    case 'ris':
      return 'ris';
    case 'csv_scopus':
      return 'csv_scopus';
    case 'csv_wos':
      return 'csv_wos';
    case 'csv_generik':
      return 'csv_generik';
  }
}

export function parseByFormat(format: FormatFile, text: string, mapping?: CsvColumnMapping): ParseResult {
  switch (format) {
    case 'bibtex':
      return parseBibtex(text);
    case 'ris':
      return parseRis(text);
    case 'csv_scopus':
      return parseScopusCsv(text, mapping);
    case 'csv_wos':
      return parseWosCsv(text, mapping);
    case 'csv_generik': {
      const csv = parseCsvRows(text);
      return applyColumnMapping(csv, mapping ?? detectMapping(csv.headers));
    }
  }
}

export { parseBibtex, parseRis, parseScopusCsv, parseWosCsv, parseCsvRows };
export { previewCsvHeaders } from './csvGeneric';
export { detectScopusMapping } from './csvScopus';
export { detectWosMapping } from './csvWos';
export { detectMapping as detectGenericMapping, CSV_TARGET_FIELDS } from './csvColumnMapping';
export type { CsvColumnMapping, CsvTargetField } from './csvColumnMapping';
export type { ParseResult, ParsedEntry, ParseIssue } from './normalize';
