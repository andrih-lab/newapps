import { getProject } from '../db/repositories/projectRepo';
import { listSearchQueries } from '../db/repositories/searchQueryRepo';
import { listRecordsByProject } from '../db/repositories/recordRepo';
import { listCriteria } from '../db/repositories/criterionRepo';
import { listExtractionsByRecordIds } from '../db/repositories/extractionRepo';
import { listScreeningLogsByRecordIds } from '../db/repositories/screeningLogRepo';
import { computePrismaCounts, type PrismaCounts } from '../prisma/computePrisma';
import { getMatrixColumns } from '../extraction/defaultColumns';
import {
  computeAnnualProduction,
  computeTopAuthors,
  computeTopJournals,
  computeTopCountries,
  computeMostCited,
  computeLotka,
  computeBradford,
} from '../bibliometrics';
import type { Project, SearchQuery, MatrixColumnDef } from '../types/project';
import type { Criterion, Extraction, RecordItem, ScreeningLog } from '../types/record';

export interface ReportData {
  project: Project;
  searchQueries: SearchQuery[];
  allRecords: RecordItem[];
  nonDuplicateRecords: RecordItem[];
  /** Record yang lolos skrining abstrak DAN dinilai layak pada full teks — himpunan akhir "disertakan". */
  includedRecords: RecordItem[];
  criteria: Criterion[];
  matrixColumns: MatrixColumnDef[];
  extractionByRecordId: Map<string, Extraction>;
  screeningLogs: ScreeningLog[];
  prisma: PrismaCounts;
  bibliometrics: {
    annualProduction: ReturnType<typeof computeAnnualProduction>;
    topAuthors: ReturnType<typeof computeTopAuthors>;
    topJournals: ReturnType<typeof computeTopJournals>;
    topCountries: ReturnType<typeof computeTopCountries>;
    mostCited: ReturnType<typeof computeMostCited>;
    lotka: ReturnType<typeof computeLotka>;
    bradford: ReturnType<typeof computeBradford>;
  };
}

/** Kumpulkan seluruh data yang dibutuhkan generator Bab Metode & Hasil (Bagian 4, Modul 7). */
export async function gatherReportData(projectId: string): Promise<ReportData> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Proyek tidak ditemukan.');

  const [searchQueries, allRecords, criteria] = await Promise.all([
    listSearchQueries(projectId),
    listRecordsByProject(projectId),
    listCriteria(projectId),
  ]);

  const recordIds = allRecords.map((r) => r.id);
  const [extractions, screeningLogs] = await Promise.all([
    listExtractionsByRecordIds(recordIds),
    listScreeningLogsByRecordIds(recordIds),
  ]);

  const nonDuplicateRecords = allRecords.filter((r) => r.statusDuplikat !== 'duplikat');
  const includedRecords = nonDuplicateRecords.filter(
    (r) => r.statusSkrining === 'termasuk' && r.statusFullText === 'termasuk',
  );

  return {
    project,
    searchQueries,
    allRecords,
    nonDuplicateRecords,
    includedRecords,
    criteria,
    matrixColumns: getMatrixColumns(project.kolomEkstraksi),
    extractionByRecordId: new Map(extractions.map((e) => [e.recordId, e])),
    screeningLogs,
    prisma: computePrismaCounts(allRecords),
    bibliometrics: {
      annualProduction: computeAnnualProduction(nonDuplicateRecords),
      topAuthors: computeTopAuthors(nonDuplicateRecords, 5),
      topJournals: computeTopJournals(nonDuplicateRecords, 5),
      topCountries: computeTopCountries(nonDuplicateRecords, 5),
      mostCited: computeMostCited(nonDuplicateRecords, 5),
      lotka: computeLotka(nonDuplicateRecords),
      bradford: computeBradford(nonDuplicateRecords),
    },
  };
}
