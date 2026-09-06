import type { ImportSummary } from '../../services/importOrchestrator';

export interface ImportLogEntry {
  filename: string;
  summary: ImportSummary;
}

export function ImportProgress({ logs }: { logs: ImportLogEntry[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Riwayat Impor</h2>
      <ul className="mt-3 space-y-3">
        {logs.map((log, idx) => (
          <li key={idx} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
            <div className="font-medium text-gray-900">{log.filename}</div>
            <div className="mt-1 text-gray-600">
              {log.summary.totalBerhasil} dari {log.summary.totalMentah} entri berhasil diimpor.
            </div>
            {log.summary.issues.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-amber-700">
                  {log.summary.issues.length} entri bermasalah (klik untuk lihat detail)
                </summary>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-600">
                  {log.summary.issues.map((issue, i) => (
                    <li key={i}>
                      #{issue.posisi}: {issue.pesan}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
