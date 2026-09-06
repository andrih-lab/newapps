import { useState } from 'react';
import type { MatrixColumnDef } from '../../types/project';
import { Button } from '../common/Button';

interface Props {
  columns: MatrixColumnDef[];
  onChange: (columns: MatrixColumnDef[]) => void;
}

function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
  return slug || `kolom_${Date.now()}`;
}

/** Kustomisasi kolom matriks ekstraksi per proyek (Bagian 4, Modul 5 — "kolom dapat dikustomisasi"). */
export function ColumnEditor({ columns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [labelBaru, setLabelBaru] = useState('');

  function handleAdd() {
    if (!labelBaru.trim()) return;
    const key = slugify(labelBaru.trim());
    if (columns.some((c) => c.key === key)) return;
    onChange([...columns, { key, label: labelBaru.trim() }]);
    setLabelBaru('');
  }

  function handleRemove(key: string) {
    onChange(columns.filter((c) => c.key !== key));
  }

  function handleRename(key: string, label: string) {
    onChange(columns.map((c) => (c.key === key ? { ...c, label } : c)));
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-indigo-600 underline">
        Kustomisasi kolom matriks
      </button>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900">Kolom Matriks Ekstraksi</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 underline">
          Tutup
        </button>
      </div>
      <ul className="space-y-1">
        {columns.map((c) => (
          <li key={c.key} className="flex items-center gap-2">
            <input
              value={c.label}
              onChange={(e) => handleRename(c.key, e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <button onClick={() => handleRemove(c.key)} className="text-xs text-red-500 hover:underline">
              Hapus
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={labelBaru}
          onChange={(e) => setLabelBaru(e.target.value)}
          placeholder="Nama kolom baru..."
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
        />
        <Button variant="secondary" onClick={handleAdd}>
          + Tambah
        </Button>
      </div>
    </div>
  );
}
