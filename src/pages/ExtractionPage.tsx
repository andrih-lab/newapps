import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import {
  listRecordsForExtraction,
  setPdfInfo,
  setFullTextDecision,
  resetFullTextDecision,
} from '../db/repositories/recordRepo';
import { listCriteria } from '../db/repositories/criterionRepo';
import { getExtractionByRecordId, upsertExtraction } from '../db/repositories/extractionRepo';
import { updateExtractionColumns } from '../db/repositories/projectRepo';
import { getMatrixColumns } from '../extraction/defaultColumns';
import { generateExtractionTemplate } from '../extraction/templateCsv';
import { downloadCsv } from '../lib/exportCsv';
import type { Criterion, Extraction, KutipanVerbatim, RecordItem } from '../types/record';
import type { MatrixColumnDef } from '../types/project';
import { PdfViewer } from '../components/extraction/PdfViewer';
import { ExtractionForm } from '../components/extraction/ExtractionForm';
import { ColumnEditor } from '../components/extraction/ColumnEditor';
import { FullTextDecision } from '../components/extraction/FullTextDecision';
import { ImportValidatorDialog } from '../components/extraction/ImportValidatorDialog';
import { Button } from '../components/common/Button';

export function ExtractionPage() {
  const { project } = useProjectContext();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [columns, setColumns] = useState<MatrixColumnDef[]>(getMatrixColumns(project.kolomEkstraksi));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null | undefined>(undefined);
  const [showImportDialog, setShowImportDialog] = useState(false);

  async function refreshRecords(keepSelection = true) {
    const list = await listRecordsForExtraction(project.id);
    setRecords(list);
    if (!keepSelection || (!selectedId && list.length > 0)) {
      setSelectedId(list[0]?.id ?? null);
    }
  }

  useEffect(() => {
    refreshRecords(false);
    listCriteria(project.id).then((c) => setCriteria(c.filter((x) => x.tipe === 'eksklusi')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  useEffect(() => {
    if (!selectedId) {
      setExtraction(null);
      return;
    }
    setExtraction(undefined);
    getExtractionByRecordId(selectedId).then((e) => setExtraction(e ?? null));
  }, [selectedId]);

  const selected = records.find((r) => r.id === selectedId) ?? null;

  async function handleColumnsChange(next: MatrixColumnDef[]) {
    setColumns(next);
    await updateExtractionColumns(project.id, next);
  }

  async function handleSaveExtraction(kolom: Record<string, string>, kutipan: KutipanVerbatim[]) {
    if (!selectedId) return;
    const updated = await upsertExtraction(selectedId, kolom, kutipan);
    setExtraction(updated);
  }

  async function handleTeksDiekstrak(fileName: string, teks: string) {
    if (!selectedId) return;
    await setPdfInfo(selectedId, fileName, teks);
    await refreshRecords();
  }

  async function handleFullTextDecide(keputusan: 'masuk' | 'tolak', label: string | null) {
    if (!selectedId) return;
    await setFullTextDecision(selectedId, keputusan, label);
    await refreshRecords();
  }

  async function handleFullTextReset() {
    if (!selectedId) return;
    await resetFullTextDecision(selectedId);
    await refreshRecords();
  }

  function handleDownloadTemplate() {
    downloadCsv('template-matriks-ekstraksi.csv', generateExtractionTemplate(records, columns));
  }

  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada artikel yang lolos skrining abstrak ("masuk"). Selesaikan tahap Skrining terlebih dahulu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {records.length} artikel lolos skrining abstrak, siap dinilai kelayakan full teks.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ColumnEditor columns={columns} onChange={handleColumnsChange} />
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            Unduh Template CSV
          </Button>
          <Button variant="secondary" onClick={() => setShowImportDialog(true)}>
            Unggah Template Terisi
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="max-h-[70vh] overflow-y-auto rounded-md border border-gray-200 bg-white">
          <ul className="divide-y divide-gray-100 text-sm">
            {records.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className={`block w-full px-3 py-2 text-left ${
                    r.id === selectedId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="truncate font-medium">{r.judul || '(tanpa judul)'}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {r.statusFullText === 'termasuk'
                      ? '✓ disertakan'
                      : r.statusFullText === 'dikecualikan'
                        ? '✗ dieksklusi'
                        : 'belum dinilai'}
                    {r.pdfFileName && ' · PDF terhubung'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {selected && (
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selected.judul}</h2>
              <p className="text-xs text-gray-500">
                {selected.penulis.join(', ') || 'Penulis tidak diketahui'} — {selected.tahun ?? '—'}
              </p>
            </div>

            <FullTextDecision
              status={selected.statusFullText}
              labelEksklusi={selected.labelEksklusiFullText}
              criteriaEksklusi={criteria}
              onDecide={handleFullTextDecide}
              onReset={handleFullTextReset}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div style={{ height: 520 }}>
                <PdfViewer
                  recordId={selected.id}
                  pdfFileNameTersimpan={selected.pdfFileName}
                  onTeksDiekstrak={handleTeksDiekstrak}
                />
              </div>
              <div style={{ height: 520 }}>
                {extraction === undefined ? (
                  <p className="text-sm text-gray-500">Memuat...</p>
                ) : (
                  <ExtractionForm
                    key={selected.id}
                    columns={columns}
                    initialKolom={extraction?.kolom ?? {}}
                    initialKutipan={extraction?.kutipan ?? []}
                    onSave={handleSaveExtraction}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showImportDialog && (
        <ImportValidatorDialog
          records={records}
          columns={columns}
          onApplied={async () => {
            setShowImportDialog(false);
            if (selectedId) setExtraction((await getExtractionByRecordId(selectedId)) ?? null);
          }}
          onClose={() => setShowImportDialog(false)}
        />
      )}
    </div>
  );
}
