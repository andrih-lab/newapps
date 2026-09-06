import type { DedupeRingkasan } from '../../services/dedupe';

export function DedupeSummary({ ringkasan }: { ringkasan: DedupeRingkasan }) {
  return (
    <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <div className="rounded-md bg-gray-50 p-3">
        <dt className="text-gray-500">Record Diperiksa</dt>
        <dd className="text-lg font-semibold text-gray-900">{ringkasan.totalRecord}</dd>
      </div>
      <div className="rounded-md bg-gray-50 p-3">
        <dt className="text-gray-500">Duplikat via DOI</dt>
        <dd className="text-lg font-semibold text-gray-900">{ringkasan.totalDuplikatDoi}</dd>
      </div>
      <div className="rounded-md bg-gray-50 p-3">
        <dt className="text-gray-500">Kandidat via Judul</dt>
        <dd className="text-lg font-semibold text-gray-900">{ringkasan.totalKandidat}</dd>
      </div>
    </dl>
  );
}
