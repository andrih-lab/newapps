import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { listRecordsByProject } from '../db/repositories/recordRepo';
import { listScreeningLogsByRecordIds } from '../db/repositories/screeningLogRepo';
import { listExtractionsByRecordIds } from '../db/repositories/extractionRepo';
import { exportProjectBackup } from '../db/repositories/backupRepo';
import { getMatrixColumns } from '../extraction/defaultColumns';
import type { Extraction, RecordItem, ScreeningLog } from '../types/record';
import { recordsToRis } from '../lib/exportRis';
import { recordsToBibtex } from '../lib/exportBibtex';
import { downloadBlob, downloadCsv, toCsv } from '../lib/exportCsv';
import { Button } from '../components/common/Button';

function downloadText(filename: string, mime: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

export function ExportPage() {
  const { project } = useProjectContext();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [logs, setLogs] = useState<ScreeningLog[]>([]);
  const [extractions, setExtractions] = useState<Extraction[]>([]);

  useEffect(() => {
    listRecordsByProject(project.id).then(async (r) => {
      setRecords(r);
      setLogs(await listScreeningLogsByRecordIds(r.map((x) => x.id)));
      setExtractions(await listExtractionsByRecordIds(r.map((x) => x.id)));
    });
  }, [project.id]);

  const termasuk = records.filter((r) => r.statusSkrining === 'termasuk');
  const recordById = new Map(records.map((r) => [r.id, r]));
  const columns = getMatrixColumns(project.kolomEkstraksi);

  function handleExportRis() {
    downloadText('artikel-terpilih.ris', 'application/x-research-info-systems', recordsToRis(termasuk));
  }

  function handleExportBibtex() {
    downloadText('artikel-terpilih.bib', 'application/x-bibtex', recordsToBibtex(termasuk));
  }

  function handleExportLogCsv() {
    const rows = logs.map((l) => ({
      judul: recordById.get(l.recordId)?.judul ?? '',
      keputusan: l.keputusan,
      alasan: l.alasan ?? '',
      waktu: l.waktu,
      penilai: l.penilai ?? '',
    }));
    downloadCsv('log-keputusan.csv', toCsv(rows));
  }

  function handleExportExtractionCsv() {
    const rows = extractions.map((ex) => {
      const record = recordById.get(ex.recordId);
      const row: Record<string, unknown> = {
        judul: record?.judul ?? '',
        statusFullText: record?.statusFullText ?? '',
        labelEksklusiFullText: record?.labelEksklusiFullText ?? '',
      };
      for (const col of columns) row[col.key] = ex.kolom[col.key] ?? '';
      row.kutipanVerbatim = ex.kutipan.map((k) => `${k.teks}${k.halaman != null ? ` (hal. ${k.halaman})` : ''}`).join('; ');
      return row;
    });
    downloadCsv(
      'matriks-ekstraksi.csv',
      toCsv(rows, ['judul', 'statusFullText', 'labelEksklusiFullText', ...columns.map((c) => c.key), 'kutipanVerbatim']),
    );
  }

  async function handleExportBackup() {
    const backup = await exportProjectBackup(project.id);
    const safeName = project.nama.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'proyek';
    downloadText(`cadangan-${safeName}.json`, 'application/json', JSON.stringify(backup, null, 2));
  }

  function handleExportRecordsCsv() {
    const rows = records.map((r) => ({
      judul: r.judul,
      penulis: r.penulis.join('; '),
      tahun: r.tahun ?? '',
      jurnal: r.jurnal,
      doi: r.doi ?? '',
      sumber: r.sumber,
      statusDuplikat: r.statusDuplikat,
      statusSkrining: r.statusSkrining,
      labelEksklusi: r.labelEksklusi ?? '',
      jumlahSitasi: r.jumlahSitasi,
    }));
    downloadCsv('semua-record.csv', toCsv(rows));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Total record: {records.length}. Artikel lolos skrining ("masuk"): {termasuk.length}. Log keputusan
        tercatat: {logs.length}. Matriks ekstraksi terisi: {extractions.length}.
      </p>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Artikel Terpilih</h2>
        <p className="mt-1 text-sm text-gray-600">
          Daftar artikel dengan keputusan skrining "masuk", untuk diimpor ke Mendeley/Zotero.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={handleExportRis} disabled={termasuk.length === 0}>
            Unduh RIS
          </Button>
          <Button variant="secondary" onClick={handleExportBibtex} disabled={termasuk.length === 0}>
            Unduh BibTeX
          </Button>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Log Keputusan Skrining</h2>
        <p className="mt-1 text-sm text-gray-600">
          Seluruh keputusan (masuk/tolak/ragu) beserta alasan, waktu, dan penilai — lampiran untuk reviewer.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={handleExportLogCsv} disabled={logs.length === 0}>
            Unduh CSV
          </Button>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Matriks Ekstraksi</h2>
        <p className="mt-1 text-sm text-gray-600">
          Seluruh isian matriks ekstraksi (Modul 5) beserta kutipan verbatim, sebagai CSV.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={handleExportExtractionCsv} disabled={extractions.length === 0}>
            Unduh CSV
          </Button>
        </div>
      </section>

      <section className="rounded-md border border-indigo-200 bg-indigo-50 p-4">
        <h2 className="text-base font-semibold text-gray-900">Cadangan Proyek</h2>
        <p className="mt-1 text-sm text-gray-600">
          Seluruh data proyek ini (record, kriteria, matriks ekstraksi, log keputusan) sebagai satu file JSON —
          untuk cadangan atau dipindahkan ke perangkat/peramban lain. Pulihkan lewat halaman "Proyek Saya".
        </p>
        <div className="mt-3">
          <Button onClick={handleExportBackup}>Unduh Cadangan (JSON)</Button>
        </div>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Semua Record</h2>
        <p className="mt-1 text-sm text-gray-600">
          Seluruh record proyek (termasuk yang ditandai duplikat) beserta status deduplikasi & skrining,
          sebagai CSV — bisa langsung dibuka di Excel.
        </p>
        <div className="mt-3">
          <Button variant="secondary" onClick={handleExportRecordsCsv} disabled={records.length === 0}>
            Unduh CSV
          </Button>
        </div>
      </section>
    </div>
  );
}
