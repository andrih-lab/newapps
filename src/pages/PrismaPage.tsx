import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { listRecordsByProject } from '../db/repositories/recordRepo';
import { computePrismaCounts, type PrismaCounts } from '../prisma/computePrisma';
import { PrismaDiagram } from '../components/prisma/PrismaDiagram';
import type { RecordItem } from '../types/record';

function ReasonTable({ title, rows }: { title: string; rows: Array<{ label: string; jumlah: number }> }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-gray-100">
              <td className="py-1 pr-2 text-gray-700">{r.label}</td>
              <td className="py-1 text-right font-medium text-gray-900">{r.jumlah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrismaPage() {
  const { project } = useProjectContext();
  const [records, setRecords] = useState<RecordItem[] | null>(null);
  const [counts, setCounts] = useState<PrismaCounts | null>(null);

  useEffect(() => {
    setRecords(null);
    listRecordsByProject(project.id).then((r) => {
      setRecords(r);
      setCounts(computePrismaCounts(r));
    });
  }, [project.id]);

  if (!records) return <p className="text-sm text-gray-500">Memuat data...</p>;
  if (records.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada record di proyek ini. Impor data terlebih dahulu.</p>;
  }
  if (!counts) return null;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Diagram digambar langsung dari hitungan tiap tahap yang tersimpan di proyek ini, mengikuti format
        PRISMA 2020.
      </p>

      <PrismaDiagram counts={counts} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ReasonTable
          title="Rincian sumber identifikasi"
          rows={counts.identifikasi.perSumber.map((s) => ({ label: s.sumber, jumlah: s.jumlah }))}
        />
        <ReasonTable title="Rincian alasan eksklusi (skrining abstrak)" rows={counts.dieksklusiSkrining.alasan} />
        <ReasonTable title="Rincian alasan eksklusi (full teks)" rows={counts.dieksklusiFullText.alasan} />
      </div>
    </div>
  );
}
