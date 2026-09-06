import type { CitedRecordSummary } from '../../bibliometrics/mostCited';
import { downloadCsv, toCsv } from '../../lib/exportCsv';

export function MostCitedTable({ data }: { data: CitedRecordSummary[] }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Artikel Paling Banyak Disitasi</h2>
        <button
          onClick={() => {
            const rows = data.map((r) => ({
              judul: r.judul,
              penulis: r.penulis.join('; '),
              tahun: r.tahun ?? '',
              jurnal: r.jurnal,
              jumlahSitasi: r.jumlahSitasi,
            }));
            downloadCsv('artikel-tersitasi.csv', toCsv(rows));
          }}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          CSV
        </button>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-1 pr-2">Judul</th>
                <th className="py-1 pr-2">Tahun</th>
                <th className="py-1 pr-2">Jurnal</th>
                <th className="py-1 text-right">Sitasi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-1 pr-2 text-gray-800">{r.judul}</td>
                  <td className="py-1 pr-2 text-gray-600">{r.tahun ?? '—'}</td>
                  <td className="py-1 pr-2 text-gray-600">{r.jurnal}</td>
                  <td className="py-1 text-right font-medium text-gray-900">{r.jumlahSitasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
