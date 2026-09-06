import { useState } from 'react';
import {
  CSV_TARGET_FIELDS,
  detectGenericMapping,
  detectScopusMapping,
  detectWosMapping,
  type CsvColumnMapping,
  type CsvTargetField,
} from '../../parsers';
import type { FormatFile } from '../../parsers';
import { Button } from '../common/Button';

interface Props {
  filename: string;
  headers: string[];
  initialFormat: FormatFile;
  initialMapping: CsvColumnMapping;
  onCancel: () => void;
  onConfirm: (format: FormatFile, mapping: CsvColumnMapping) => void;
}

const FIELD_LABEL: Record<CsvTargetField, string> = {
  judul: 'Judul',
  penulis: 'Penulis',
  tahun: 'Tahun',
  jurnal: 'Jurnal/Sumber',
  doi: 'DOI',
  abstrak: 'Abstrak',
  kataKunci: 'Kata Kunci',
  jumlahSitasi: 'Jumlah Sitasi',
  penerbit: 'Penerbit',
};

const FORMAT_OPTIONS: Array<{ value: FormatFile; label: string }> = [
  { value: 'csv_scopus', label: 'CSV Scopus' },
  { value: 'csv_wos', label: 'CSV Web of Science' },
  { value: 'csv_generik', label: 'CSV Generik' },
];

/** Dialog koreksi manual pemetaan kolom CSV (Bagian 4, Modul 1b). */
export function ColumnMappingDialog({ filename, headers, initialFormat, initialMapping, onCancel, onConfirm }: Props) {
  const [format, setFormat] = useState<FormatFile>(initialFormat);
  const [mapping, setMapping] = useState<CsvColumnMapping>(initialMapping);

  function handleFormatChange(next: FormatFile) {
    setFormat(next);
    if (next === 'csv_scopus') setMapping(detectScopusMapping(headers));
    else if (next === 'csv_wos') setMapping(detectWosMapping(headers));
    else setMapping(detectGenericMapping(headers));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold">Pemetaan Kolom — {filename}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Periksa dan koreksi pemetaan kolom sebelum data diimpor. Kolom "Judul" wajib dipetakan.
        </p>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Jenis CSV</label>
          <select
            value={format}
            onChange={(e) => handleFormatChange(e.target.value as FormatFile)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {FORMAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          {CSV_TARGET_FIELDS.map((field) => (
            <div key={field} className="flex items-center gap-3">
              <label className="w-32 shrink-0 text-sm text-gray-700">{FIELD_LABEL[field]}</label>
              <select
                value={mapping[field] ?? ''}
                onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value || null }))}
                className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">(tidak dipetakan)</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={() => onConfirm(format, mapping)} disabled={!mapping.judul}>
            Impor
          </Button>
        </div>
      </div>
    </div>
  );
}
