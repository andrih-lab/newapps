import { useState } from 'react';
import type { MatrixColumnDef } from '../../types/project';
import type { KutipanVerbatim } from '../../types/record';
import { Button } from '../common/Button';

interface Props {
  columns: MatrixColumnDef[];
  initialKolom: Record<string, string>;
  initialKutipan: KutipanVerbatim[];
  onSave: (kolom: Record<string, string>, kutipan: KutipanVerbatim[]) => void;
}

/** Formulir matriks ekstraksi + kutipan verbatim (Bagian 4, Modul 5). Autosave ke IndexedDB. */
export function ExtractionForm({ columns, initialKolom, initialKutipan, onSave }: Props) {
  const [kolom, setKolom] = useState<Record<string, string>>(initialKolom);
  const [kutipan, setKutipan] = useState<KutipanVerbatim[]>(initialKutipan);
  const [teksBaru, setTeksBaru] = useState('');
  const [halamanBaru, setHalamanBaru] = useState('');

  function handleFieldChange(key: string, value: string) {
    setKolom((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldBlur() {
    onSave(kolom, kutipan);
  }

  function handleAddKutipan() {
    if (!teksBaru.trim()) return;
    const next = [...kutipan, { teks: teksBaru.trim(), halaman: halamanBaru ? Number(halamanBaru) : null }];
    setKutipan(next);
    setTeksBaru('');
    setHalamanBaru('');
    onSave(kolom, next);
  }

  function handleRemoveKutipan(idx: number) {
    const next = kutipan.filter((_, i) => i !== idx);
    setKutipan(next);
    onSave(kolom, next);
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="space-y-3">
        {columns.map((col) => (
          <div key={col.key}>
            <label className="mb-1 block text-xs font-medium text-gray-700">{col.label}</label>
            <textarea
              value={kolom[col.key] ?? ''}
              onChange={(e) => handleFieldChange(col.key, e.target.value)}
              onBlur={handleFieldBlur}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
        <h3 className="text-xs font-semibold text-amber-800">
          Kutipan Verbatim{' '}
          {kutipan.length === 0 && <span className="font-normal">(wajib untuk isian penting — belum ada)</span>}
        </h3>
        <p className="mt-1 text-xs text-amber-700">
          Potongan kalimat asli + nomor halaman, agar isian di atas bisa ditelusuri kembali ke sumbernya.
        </p>
        <ul className="mt-2 space-y-1">
          {kutipan.map((k, i) => (
            <li key={i} className="flex items-start justify-between gap-2 rounded bg-white p-2 text-xs">
              <span>
                &ldquo;{k.teks}&rdquo; {k.halaman != null && <span className="text-gray-500">(hal. {k.halaman})</span>}
              </span>
              <button onClick={() => handleRemoveKutipan(i)} className="shrink-0 text-red-500 hover:underline">
                Hapus
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={teksBaru}
            onChange={(e) => setTeksBaru(e.target.value)}
            placeholder="Kutip kalimat asli..."
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
          <input
            value={halamanBaru}
            onChange={(e) => setHalamanBaru(e.target.value)}
            placeholder="Hal."
            type="number"
            className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
          <Button variant="secondary" onClick={handleAddKutipan}>
            + Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
