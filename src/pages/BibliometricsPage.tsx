import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { listNonDuplicateRecords } from '../db/repositories/recordRepo';
import type { RecordItem } from '../types/record';
import {
  computeAnnualProduction,
  computeTopAuthors,
  computeTopInstitutions,
  computeTopCountries,
  computeTopJournals,
  computeMostCited,
  computeLotka,
  computeBradford,
  computeKeywordCooccurrence,
  computeCoAuthorshipAuthors,
  computeCoAuthorshipCountries,
  computeKeywordTrends,
} from '../bibliometrics';
import { AnnualProductionChart } from '../components/bibliometrics/AnnualProductionChart';
import { TopProducersTable } from '../components/bibliometrics/TopProducersTable';
import { MostCitedTable } from '../components/bibliometrics/MostCitedTable';
import { LotkaChart } from '../components/bibliometrics/LotkaChart';
import { BradfordChart } from '../components/bibliometrics/BradfordChart';
import { KeywordCooccurrenceNetwork } from '../components/bibliometrics/KeywordCooccurrenceNetwork';
import { CoAuthorshipNetwork } from '../components/bibliometrics/CoAuthorshipNetwork';
import { KeywordTrendChart } from '../components/bibliometrics/KeywordTrendChart';

export function BibliometricsPage() {
  const { project } = useProjectContext();
  const [records, setRecords] = useState<RecordItem[] | null>(null);

  useEffect(() => {
    setRecords(null);
    listNonDuplicateRecords(project.id).then(setRecords);
  }, [project.id]);

  const metrics = useMemo(() => {
    if (!records) return null;
    return {
      annual: computeAnnualProduction(records),
      authors: computeTopAuthors(records),
      institutions: computeTopInstitutions(records),
      countries: computeTopCountries(records),
      journals: computeTopJournals(records),
      mostCited: computeMostCited(records),
      lotka: computeLotka(records),
      bradford: computeBradford(records),
      keywordNetwork: computeKeywordCooccurrence(records),
      authorNetwork: computeCoAuthorshipAuthors(records),
      countryNetwork: computeCoAuthorshipCountries(records),
      keywordTrends: computeKeywordTrends(records),
    };
  }, [records]);

  if (!records) {
    return <p className="text-sm text-gray-500">Memuat data...</p>;
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada record (non-duplikat) di proyek ini. Impor data terlebih dahulu di tab Impor Data.
      </p>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-10">
      <p className="text-sm text-gray-500">{records.length} record dianalisis (duplikat terkonfirmasi dikecualikan).</p>

      <AnnualProductionChart data={metrics.annual} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TopProducersTable title="Penulis Paling Produktif" data={metrics.authors} filename="penulis-produktif.csv" />
        <TopProducersTable title="Institusi Paling Produktif" data={metrics.institutions} filename="institusi-produktif.csv" />
        <TopProducersTable title="Negara Paling Produktif" data={metrics.countries} filename="negara-produktif.csv" />
        <TopProducersTable title="Jurnal Paling Produktif" data={metrics.journals} filename="jurnal-produktif.csv" />
      </div>

      <MostCitedTable data={metrics.mostCited} />

      <LotkaChart result={metrics.lotka} />

      <BradfordChart result={metrics.bradford} />

      <KeywordTrendChart series={metrics.keywordTrends} />

      <div className="grid gap-4 lg:grid-cols-2">
        <KeywordCooccurrenceNetwork data={metrics.keywordNetwork} />
        <CoAuthorshipNetwork title="Co-authorship Penulis" data={metrics.authorNetwork} />
      </div>
      <CoAuthorshipNetwork title="Co-authorship Negara" data={metrics.countryNetwork} />
    </div>
  );
}
