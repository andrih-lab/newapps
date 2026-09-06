import { useState } from 'react';
import type { RecordItem } from '../../types/record';
import type { MatrixColumnDef } from '../../types/project';
import { validateExtractionImport, type ImportRowResult } from '../../extraction/importValidator';
import { upsertExtraction } from '../../db/repositories/extractionRepo';
import { Button } from '../common/Button';

interface Props {
  records: RecordItem[];
  columns: MatrixColumnDef[];
  onApplied: () => void;
  onClose: () => void;
}

/** Dialog unggah template CSV terisi + validator (Bagian 4, Modul 5). */
export function ImportValidatorDialog({ records, columns, onApplied, onClose }: Props) {
  const [results, setResults] = useState<ImportRowResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    setResults(validateExtractionImport(text, records, columns));
  }

  async function handleApply() {
    if (!results) return;
    setBusy(true);
    try {
      const matched = results.filter((r) => r.record);
      for (const r of matched) {
        if (r.record) await upsertExtraction(r.record.id, r.kolom, r.kutipan);
      }
      onApplied();
    } finally {
      setBusy(false);
    }
  }

  const matchedCount = results?.filter((r) => r.record).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold">Unggah Template Terisi</h3>
        <p className="mt-1 text-sm text-gray-600">
          File CSV divalidasi: judul dicocokkan dengan artikel yang lolos skrining (Jaro-Winkler), kelengkapan
          kolom diperiksa.
        </p>

        {!results ? (
          <input
            type="file"
            accept=".csv"
            className="mt-3 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        ) : (
          <>
            <p className="mt-3 text-sm text-gray-700">
              {matchedCount} dari {results.length} baris cocok dengan artikel di proyek ini.
            </p>
            <div className="mt-2 max-h-80 overflow-y-auto rounded-md border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Judul (CSV)</th>
                    <th className="p-2 text-left">Cocok Dengan</th>
                    <th className="p-2 text-left">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.posisi} className="border-t border-gray-100">
                      <td className="p-2">{r.judulDiCsv || '(kosong)'}</td>
                      <td className="p-2">
                        {r.record ? `${r.record.judul} (${(r.skorKemiripan * 100).toFixed(0)}%)` : '— tidak cocok —'}
                      </td>
                      <td className="p-2 text-amber-700">{r.issues.join('; ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          {results && (
            <Button onClick={handleApply} disabled={busy || matchedCount === 0}>
              {busy ? 'Menerapkan...' : `Terapkan (${matchedCount})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
