import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { runDeduplication, type DedupeRingkasan } from '../services/dedupe';
import { listRecordsByProject, setDuplicateStatus } from '../db/repositories/recordRepo';
import type { RecordItem } from '../types/record';
import { DuplicateCandidateCard } from '../components/dedupe/DuplicateCandidateCard';
import { DedupeSummary } from '../components/dedupe/DedupeSummary';
import { Button } from '../components/common/Button';

export function DedupePage() {
  const { project } = useProjectContext();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [ringkasan, setRingkasan] = useState<DedupeRingkasan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setRecords(await listRecordsByProject(project.id));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function handleRun() {
    setBusy(true);
    setError(null);
    try {
      const result = await runDeduplication(project.id);
      setRingkasan(result);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const byId = new Map(records.map((r) => [r.id, r]));
  const kandidat = records.filter((r) => r.statusDuplikat === 'kandidat');
  const totalDuplikatTerkonfirmasi = records.filter((r) => r.statusDuplikat === 'duplikat').length;

  async function handleDecision(recordId: string, keputusan: 'duplikat' | 'unik') {
    const record = byId.get(recordId);
    if (!record) return;
    if (keputusan === 'duplikat') {
      await setDuplicateStatus(recordId, 'duplikat', record.duplicateOfId, record.similarityScore);
    } else {
      await setDuplicateStatus(recordId, 'unik', null, null);
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Deduplikasi</h2>
        <p className="mt-1 text-sm text-gray-600">
          Tahap 1 mencocokkan DOI (dinormalisasi: huruf kecil, tanpa prefiks URL) — hasilnya langsung
          ditandai duplikat. Tahap 2 memakai kemiripan judul Jaro-Winkler (ambang ~0,90), dikonfirmasi
          kesamaan tahun dan penulis pertama — hasilnya kandidat yang perlu Anda tinjau di bawah.
        </p>
        <div className="mt-3">
          <Button onClick={handleRun} disabled={busy}>
            {busy ? 'Memproses...' : 'Jalankan Deduplikasi'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {ringkasan && <DedupeSummary ringkasan={ringkasan} />}
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          Kandidat Duplikat ({kandidat.length}) &middot; Duplikat Terkonfirmasi ({totalDuplikatTerkonfirmasi})
        </h2>
        {kandidat.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Tidak ada kandidat yang menunggu keputusan.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {kandidat.map((r) => {
              const canonical = r.duplicateOfId ? byId.get(r.duplicateOfId) : undefined;
              if (!canonical) return null;
              return (
                <DuplicateCandidateCard
                  key={r.id}
                  record={r}
                  canonical={canonical}
                  onConfirm={() => handleDecision(r.id, 'duplikat')}
                  onReject={() => handleDecision(r.id, 'unik')}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
