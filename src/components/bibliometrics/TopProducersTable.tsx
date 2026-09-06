import type { ProducerCount } from '../../bibliometrics/topProducers';
import { downloadCsv, toCsv } from '../../lib/exportCsv';

interface Props {
  title: string;
  data: ProducerCount[];
  filename: string;
}

export function TopProducersTable({ title, data, filename }: Props) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => downloadCsv(filename, toCsv(data))}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          CSV
        </button>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada data.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {data.slice(0, 10).map((d) => (
              <tr key={d.nama} className="border-t border-gray-100">
                <td className="py-1 pr-2 text-gray-700">{d.nama}</td>
                <td className="py-1 text-right font-medium text-gray-900">{d.jumlah}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
