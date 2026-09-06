import { bulkAddRecords } from '../db/repositories/recordRepo';
import { recordSearchQuery } from '../db/repositories/searchQueryRepo';
import { toRecordItem, type ParseIssue } from '../parsers/normalize';
import type { FormatFile } from '../parsers';
import { formatToSumber } from '../parsers';
import type { CsvColumnMapping } from '../parsers/csvColumnMapping';
import { createRequestClient } from '../workers/workerClient';
import type { ParseWorkerRequest, ParseWorkerResponse } from '../workers/parse.worker';
import { openAlexWorkToParsedEntry, searchOpenAlex, type OpenAlexProgress } from './openalex';
import type { OpenAlexSearchParams } from '../types/openalex';

export interface ImportSummary {
  totalMentah: number;
  totalBerhasil: number;
  issues: ParseIssue[];
}

/**
 * Impor satu file (BibTeX/RIS/CSV). Parsing berat dijalankan di parse.worker
 * agar UI tidak beku (Catatan Bagian 9). Penulisan ke IndexedDB tetap di
 * thread utama.
 */
export async function importFile(
  projectId: string,
  file: File,
  format: FormatFile,
  mapping?: CsvColumnMapping,
): Promise<ImportSummary> {
  const text = await file.text();

  const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), { type: 'module' });
  try {
    const request = createRequestClient<ParseWorkerRequest, ParseWorkerResponse>(worker);
    const result = await request({ format, text, mapping });

    const sumber = formatToSumber(format);
    const records = result.entries.map((entry) => toRecordItem(entry, projectId, sumber, file.name));
    await bulkAddRecords(records);

    return {
      totalMentah: result.totalMentah,
      totalBerhasil: records.length,
      issues: result.issues,
    };
  } finally {
    worker.terminate();
  }
}

/**
 * Cari & impor dari OpenAlex, sekaligus mencatat metadata pencarian
 * (Modul 1a, wajib untuk bab Metode).
 */
export async function importFromOpenAlex(
  projectId: string,
  params: OpenAlexSearchParams,
  onProgress?: (p: OpenAlexProgress) => void,
  signal?: AbortSignal,
): Promise<ImportSummary> {
  const works = await searchOpenAlex(params, onProgress, signal);
  const records = works.map((w) => toRecordItem(openAlexWorkToParsedEntry(w), projectId, 'openalex', null));
  await bulkAddRecords(records);

  await recordSearchQuery({
    projectId,
    sumber: 'openalex',
    stringQuery: params.query,
    filter: {
      tahunMulai: params.tahunMulai,
      tahunAkhir: params.tahunAkhir,
      jenisDokumen: params.jenisDokumen,
      bahasa: params.bahasa,
    },
    jumlahHasil: records.length,
  });

  return { totalMentah: works.length, totalBerhasil: records.length, issues: [] };
}
