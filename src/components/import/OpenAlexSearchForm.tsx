import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { importFromOpenAlex, type ImportSummary } from '../../services/importOrchestrator';
import type { OpenAlexProgress } from '../../services/openalex';

interface Props {
  projectId: string;
  onImported: (summary: ImportSummary) => void;
}

const JENIS_DOKUMEN_OPTIONS = [
  { value: 'article', label: 'Artikel Jurnal' },
  { value: 'review', label: 'Artikel Review' },
  { value: 'book-chapter', label: 'Bab Buku' },
  { value: 'proceedings-article', label: 'Prosiding' },
  { value: 'dissertation', label: 'Disertasi/Tesis' },
  { value: 'preprint', label: 'Preprint' },
];

const BAHASA_OPTIONS = [
  { value: 'en', label: 'Inggris' },
  { value: 'id', label: 'Indonesia' },
];

export function OpenAlexSearchForm({ projectId, onImported }: Props) {
  const [query, setQuery] = useState('');
  const [tahunMulai, setTahunMulai] = useState('');
  const [tahunAkhir, setTahunAkhir] = useState('');
  const [jenisDokumen, setJenisDokumen] = useState<string[]>([]);
  const [bahasa, setBahasa] = useState<string[]>([]);
  const [progress, setProgress] = useState<OpenAlexProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function toggle(list: string[], value: string, setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;

    setBusy(true);
    setError(null);
    setProgress(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const summary = await importFromOpenAlex(
        projectId,
        {
          query: query.trim(),
          tahunMulai: tahunMulai ? Number(tahunMulai) : undefined,
          tahunAkhir: tahunAkhir ? Number(tahunAkhir) : undefined,
          jenisDokumen: jenisDokumen.length > 0 ? jenisDokumen : undefined,
          bahasa: bahasa.length > 0 ? bahasa : undefined,
        },
        (p) => setProgress(p),
        controller.signal,
      );
      onImported(summary);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusy(false);
      setProgress(null);
      abortRef.current = null;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">String Pencarian</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder='mis. ("artificial intelligence" OR "machine learning") AND education'
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tahun Mulai</label>
          <input
            type="number"
            value={tahunMulai}
            onChange={(e) => setTahunMulai(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tahun Akhir</label>
          <input
            type="number"
            value={tahunAkhir}
            onChange={(e) => setTahunAkhir(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">Jenis Dokumen</span>
        <div className="flex flex-wrap gap-2">
          {JENIS_DOKUMEN_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                jenisDokumen.includes(opt.value) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={jenisDokumen.includes(opt.value)}
                onChange={() => toggle(jenisDokumen, opt.value, setJenisDokumen)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-gray-700">Bahasa</span>
        <div className="flex flex-wrap gap-2">
          {BAHASA_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                bahasa.includes(opt.value) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={bahasa.includes(opt.value)}
                onChange={() => toggle(bahasa, opt.value, setBahasa)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {progress && (
        <ProgressBar
          value={progress.total > 0 ? progress.diambil / progress.total : 0}
          label={`Mengambil hasil... ${progress.diambil} dari ${progress.total}`}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Mencari...' : 'Cari & Impor'}
        </Button>
        {busy && (
          <Button type="button" variant="secondary" onClick={() => abortRef.current?.abort()}>
            Batalkan
          </Button>
        )}
      </div>
    </form>
  );
}
