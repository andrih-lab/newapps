import type { RecordItem } from '../../types/record';
import { Button } from '../common/Button';

interface Props {
  record: RecordItem;
  canonical: RecordItem;
  onConfirm: () => void;
  onReject: () => void;
}

function RecordCell({ record }: { record: RecordItem }) {
  return (
    <div className="flex-1 rounded-md bg-gray-50 p-3 text-sm">
      <div className="font-medium text-gray-900">{record.judul || '(tanpa judul)'}</div>
      <div className="mt-1 text-gray-600">
        {record.penulis.slice(0, 3).join(', ')}
        {record.penulis.length > 3 ? ' dkk.' : ''} — {record.tahun ?? '—'}
      </div>
      <div className="text-gray-500">{record.jurnal}</div>
      {record.doi && <div className="mt-1 text-xs text-gray-400">DOI: {record.doi}</div>}
    </div>
  );
}

/** Kartu perbandingan berdampingan untuk kandidat duplikat tahap 2 (Bagian 4, Modul 2). */
export function DuplicateCandidateCard({ record, canonical, onConfirm, onReject }: Props) {
  return (
    <div className="rounded-md border border-amber-200 bg-white p-3">
      <div className="mb-2 text-xs text-amber-700">
        Kemiripan judul (Jaro-Winkler): {record.similarityScore !== null ? `${(record.similarityScore * 100).toFixed(1)}%` : '—'}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <RecordCell record={canonical} />
        <RecordCell record={record} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onReject}>
          Bukan Duplikat
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Tandai Duplikat
        </Button>
      </div>
    </div>
  );
}
