import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { FileDropzone } from '../components/import/FileDropzone';
import { ColumnMappingDialog } from '../components/import/ColumnMappingDialog';
import { OpenAlexSearchForm } from '../components/import/OpenAlexSearchForm';
import { ImportProgress, type ImportLogEntry } from '../components/import/ImportProgress';
import { VirtualizedTable } from '../components/common/VirtualizedTable';
import {
  detectFormatFromFilename,
  detectGenericMapping,
  previewCsvHeaders,
  type CsvColumnMapping,
  type FormatFile,
} from '../parsers';
import { importFile } from '../services/importOrchestrator';
import { listRecordsByProject } from '../db/repositories/recordRepo';
import type { RecordItem } from '../types/record';

interface PendingCsv {
  file: File;
  headers: string[];
  mapping: CsvColumnMapping;
}

const STATUS_LABEL: Record<RecordItem['statusDuplikat'], string> = {
  unik: 'Unik',
  kandidat: 'Kandidat Duplikat',
  duplikat: 'Duplikat',
};

export function ImportPage() {
  const { project } = useProjectContext();
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const [pendingCsv, setPendingCsv] = useState<PendingCsv | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setRecords(await listRecordsByProject(project.id));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function handleFiles(files: File[]) {
    setError(null);
    for (const file of files) {
      const format = detectFormatFromFilename(file.name);
      if (!format) {
        setError(`Format file "${file.name}" tidak dikenali. Gunakan .bib, .ris, atau .csv.`);
        continue;
      }
      if (format === 'csv_generik') {
        const text = await file.text();
        const headers = previewCsvHeaders(text);
        setPendingCsv({ file, headers, mapping: detectGenericMapping(headers) });
        continue; // satu file CSV ditangani dulu lewat dialog sebelum lanjut ke file berikutnya
      }
      await runImport(file, format);
    }
  }

  async function runImport(file: File, format: FormatFile, mapping?: CsvColumnMapping) {
    setBusy(true);
    setError(null);
    try {
      const summary = await importFile(project.id, file, format, mapping);
      setLogs((prev) => [{ filename: file.name, summary }, ...prev]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmMapping(format: FormatFile, mapping: CsvColumnMapping) {
    if (!pendingCsv) return;
    const file = pendingCsv.file;
    setPendingCsv(null);
    await runImport(file, format, mapping);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Unggah File</h2>
        <p className="mt-1 text-sm text-gray-600">
          Format didukung: BibTeX (.bib), RIS (.ris), dan CSV (Scopus, Web of Science, atau generik). Beberapa
          file bisa digabung dalam satu proyek. Parser toleran terhadap baris/entri yang rusak — entri
          bermasalah dilewati dan dilaporkan, bukan menggagalkan seluruh impor.
        </p>
        <div className="mt-3">
          <FileDropzone onFiles={handleFiles} disabled={busy} accept=".bib,.ris,.csv" />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 text-sm text-gray-500">Total record di proyek ini: {records.length}</p>
      </section>

      {logs.length > 0 && <ImportProgress logs={logs} />}

      <section>
        <h2 className="text-lg font-semibold">Cari di OpenAlex</h2>
        <p className="mt-1 text-sm text-gray-600">
          Pencarian dipanggil langsung dari peramban ke OpenAlex (tanpa proxy untuk saat ini). Isi{' '}
          <code className="rounded bg-gray-100 px-1">.env</code> dengan{' '}
          <code className="rounded bg-gray-100 px-1">VITE_OPENALEX_API_KEY</code> dan/atau{' '}
          <code className="rounded bg-gray-100 px-1">VITE_OPENALEX_MAILTO</code>.
        </p>
        <div className="mt-3">
          <OpenAlexSearchForm
            projectId={project.id}
            onImported={async (summary) => {
              setLogs((prev) => [{ filename: `Pencarian OpenAlex`, summary }, ...prev]);
              await refresh();
            }}
          />
        </div>
      </section>

      {records.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Semua Record ({records.length})</h2>
          <div className="mt-3">
            <VirtualizedTable
              items={records}
              getRowKey={(r) => r.id}
              columns={[
                { key: 'judul', header: 'Judul', width: '40%', render: (r) => r.judul || '(tanpa judul)' },
                { key: 'tahun', header: 'Tahun', width: '10%', render: (r) => r.tahun ?? '—' },
                { key: 'jurnal', header: 'Jurnal', width: '25%', render: (r) => r.jurnal },
                { key: 'sumber', header: 'Sumber', width: '13%', render: (r) => r.sumber },
                { key: 'status', header: 'Status', width: '12%', render: (r) => STATUS_LABEL[r.statusDuplikat] },
              ]}
            />
          </div>
        </section>
      )}

      {pendingCsv && (
        <ColumnMappingDialog
          filename={pendingCsv.file.name}
          headers={pendingCsv.headers}
          initialFormat="csv_generik"
          initialMapping={pendingCsv.mapping}
          onCancel={() => setPendingCsv(null)}
          onConfirm={handleConfirmMapping}
        />
      )}
    </div>
  );
}
