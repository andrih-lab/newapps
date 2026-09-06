import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { listCriteria } from '../db/repositories/criterionRepo';
import { getNextForScreening, listNonDuplicateRecords } from '../db/repositories/recordRepo';
import { listScreeningLogsByRecordIds } from '../db/repositories/screeningLogRepo';
import { retrainScreening, submitScreeningDecision, undoScreeningDecision } from '../services/screening';
import { tokenize } from '../screening';
import type { Criterion, KeputusanSkrining, RecordItem, ScreeningLog } from '../types/record';
import { HighlightedAbstract } from '../components/screening/HighlightedAbstract';
import { ExclusionLabelPicker } from '../components/screening/ExclusionLabelPicker';
import { DiscoveryCurve } from '../components/screening/DiscoveryCurve';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';

const PENILAI_KEY_PREFIX = 'telaah:penilai:';

export function ScreeningPage() {
  const { project } = useProjectContext();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [current, setCurrent] = useState<RecordItem | null | undefined>(undefined);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalDinilai, setTotalDinilai] = useState(0);
  const [logs, setLogs] = useState<ScreeningLog[]>([]);
  const [modeAktif, setModeAktif] = useState<'awal' | 'active_learning'>('awal');
  const [showExclusionPicker, setShowExclusionPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [penilai, setPenilai] = useState('');
  const lastDecidedRef = useRef<string | null>(null);

  useEffect(() => {
    setPenilai(localStorage.getItem(PENILAI_KEY_PREFIX + project.id) ?? '');
  }, [project.id]);

  function handlePenilaiChange(value: string) {
    setPenilai(value);
    localStorage.setItem(PENILAI_KEY_PREFIX + project.id, value);
  }

  const refreshStats = useCallback(async () => {
    const records = await listNonDuplicateRecords(project.id);
    setTotalRecords(records.length);
    setTotalDinilai(records.filter((r) => r.statusSkrining !== 'belum').length);
    const logList = await listScreeningLogsByRecordIds(records.map((r) => r.id));
    setLogs(logList);
  }, [project.id]);

  const loadNext = useCallback(async () => {
    const next = await getNextForScreening(project.id);
    setCurrent(next ?? null);
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setCurrent(undefined);
      setCriteria(await listCriteria(project.id));
      setRetraining(true);
      try {
        const result = await retrainScreening(project);
        if (cancelled) return;
        setModeAktif(result.modeAktif);
      } finally {
        if (!cancelled) setRetraining(false);
      }
      if (cancelled) return;
      await loadNext();
      await refreshStats();
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const highlightTerms = useMemo(() => {
    const terms = new Set<string>();
    for (const c of criteria) {
      for (const t of tokenize(`${c.label} ${c.deskripsi}`)) terms.add(t);
    }
    return Array.from(terms);
  }, [criteria]);

  const criteriaEksklusi = criteria.filter((c) => c.tipe === 'eksklusi');

  const penolakanBeruntun = useMemo(() => {
    let count = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].keputusan === 'tolak') count++;
      else break;
    }
    return count;
  }, [logs]);

  async function handleDecision(keputusan: KeputusanSkrining, labelEksklusi: string | null = null) {
    if (!current || busy) return;
    setBusy(true);
    setShowExclusionPicker(false);
    const recordId = current.id;
    try {
      await submitScreeningDecision(recordId, keputusan, labelEksklusi, penilai.trim() || null);
      lastDecidedRef.current = recordId;
      await loadNext();
      await refreshStats();

      setRetraining(true);
      const result = await retrainScreening(project);
      setModeAktif(result.modeAktif);
      // Skor bisa berubah setelah retrain — pastikan record yang ditampilkan tetap yang terbaik saat ini.
      await loadNext();
    } finally {
      setRetraining(false);
      setBusy(false);
    }
  }

  async function handleUndo() {
    const recordId = lastDecidedRef.current;
    if (!recordId || busy) return;
    setBusy(true);
    try {
      await undoScreeningDecision(recordId);
      lastDecidedRef.current = null;
      setRetraining(true);
      const result = await retrainScreening(project);
      setModeAktif(result.modeAktif);
      await loadNext();
      await refreshStats();
    } finally {
      setRetraining(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (showExclusionPicker) {
        if (e.key === 'Escape') setShowExclusionPicker(false);
        return;
      }
      if (e.key === 'y' || e.key === 'Y') handleDecision('masuk');
      else if (e.key === 'n' || e.key === 'N') setShowExclusionPicker(true);
      else if (e.key === '?') handleDecision('ragu');
      else if (e.key === 'ArrowLeft') handleUndo();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy, showExclusionPicker, penilai]);

  if (totalRecords === 0) {
    return (
      <p className="text-sm text-gray-500">
        Belum ada record (non-duplikat) di proyek ini. Impor data dan jalankan deduplikasi terlebih dahulu.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ProgressBar value={totalRecords > 0 ? totalDinilai / totalRecords : 0} label={`Dinilai: ${totalDinilai} / ${totalRecords} (sisa ${totalRecords - totalDinilai})`} />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Nama penilai:</label>
            <input
              value={penilai}
              onChange={(e) => handlePenilaiChange(e.target.value)}
              placeholder="opsional"
              className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Mode saat ini: <strong>{modeAktif === 'active_learning' ? 'Active learning (Naive Bayes)' : 'Fase awal (acak + kemiripan query)'}</strong>
          {retraining && ' — melatih ulang...'}
          {penolakanBeruntun >= 5 && (
            <span className="ml-2 text-amber-600">⚠ {penolakanBeruntun} penolakan beruntun — pertimbangkan untuk berhenti.</span>
          )}
        </p>

        {current === undefined ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : current === null ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">Semua record sudah dinilai.</p>
            <p className="mt-1 text-sm text-green-700">Lanjutkan ke Diagram PRISMA atau Ekspor.</p>
          </div>
        ) : (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-base font-semibold text-gray-900">{current.judul || '(tanpa judul)'}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {current.penulis.join(', ') || 'Penulis tidak diketahui'} — {current.tahun ?? '—'}
            </p>
            <p className="text-sm text-gray-500">{current.jurnal}</p>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <HighlightedAbstract text={current.abstrak} terms={highlightTerms} />
            </div>

            {showExclusionPicker ? (
              <div className="mt-4">
                <ExclusionLabelPicker
                  labels={criteriaEksklusi}
                  onPick={(label) => handleDecision('tolak', label)}
                  onCancel={() => setShowExclusionPicker(false)}
                />
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => handleDecision('masuk')} disabled={busy}>
                  Masuk (Y)
                </Button>
                <Button variant="danger" onClick={() => setShowExclusionPicker(true)} disabled={busy}>
                  Tolak (N)
                </Button>
                <Button variant="secondary" onClick={() => handleDecision('ragu')} disabled={busy}>
                  Ragu (?)
                </Button>
                <Button variant="ghost" onClick={handleUndo} disabled={busy || !lastDecidedRef.current}>
                  ← Mundur
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-gray-900">Pintasan Keyboard</h3>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            <li>
              <kbd className="rounded bg-gray-100 px-1">Y</kbd> — masuk
            </li>
            <li>
              <kbd className="rounded bg-gray-100 px-1">N</kbd> — tolak (pilih label)
            </li>
            <li>
              <kbd className="rounded bg-gray-100 px-1">?</kbd> — ragu
            </li>
            <li>
              <kbd className="rounded bg-gray-100 px-1">←</kbd> — mundur/batalkan terakhir
            </li>
          </ul>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-3">
          <DiscoveryCurve logs={logs.map((l) => ({ keputusan: l.keputusan }))} />
        </div>
      </aside>
    </div>
  );
}
