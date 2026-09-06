import type { Criterion } from '../../types/record';

interface Props {
  labels: Criterion[];
  onPick: (label: string) => void;
  onCancel: () => void;
}

/** Daftar label eksklusi satu-klik yang muncul saat pengguna menolak artikel (Bagian 4, Modul 4c). */
export function ExclusionLabelPicker({ labels, onPick, onCancel }: Props) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <p className="mb-2 text-sm font-medium text-red-800">Pilih alasan penolakan:</p>
      {labels.length === 0 ? (
        <p className="text-sm text-red-700">Belum ada kriteria eksklusi. Tambahkan di halaman Kriteria, atau tolak tanpa label.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {labels.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c.label)}
              className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-100"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-3">
        <button onClick={() => onPick('(tanpa label)')} className="text-xs text-gray-500 underline">
          Tolak tanpa label
        </button>
        <button onClick={onCancel} className="text-xs text-gray-500 underline">
          Batal (Esc)
        </button>
      </div>
    </div>
  );
}
