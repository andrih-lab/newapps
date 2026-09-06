import { useEffect, useRef, useState } from 'react';
import { extractPagesText, getDocument, joinPagesWithMarkers, type PDFDocumentProxy } from '../../extraction/pdfjs';
import { getCachedPdf, setCachedPdf } from '../../extraction/pdfFileCache';
import { Button } from '../common/Button';

interface Props {
  recordId: string;
  pdfFileNameTersimpan: string | null;
  onTeksDiekstrak: (fileName: string, teksGabungan: string) => void;
}

interface SearchHit {
  halaman: number;
  cuplikan: string;
}

export function PdfViewer({ recordId, pdfFileNameTersimpan, onTeksDiekstrak }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pagesText, setPagesText] = useState<string[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hit, setHit] = useState<SearchHit | null>(null);

  useEffect(() => {
    const cached = getCachedPdf(recordId);
    if (cached) void loadFile(cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  async function loadFile(f: File) {
    setLoading(true);
    setError(null);
    setHit(null);
    try {
      setCachedPdf(recordId, f);
      setFile(f);
      const buffer = await f.arrayBuffer();
      const doc = await getDocument({ data: buffer }).promise;
      setPdfDoc(doc);
      setPageNum(1);
      const pages = await extractPagesText(doc);
      setPagesText(pages);
      onTeksDiekstrak(f.name, joinPagesWithMarkers(pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca PDF.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function render() {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
    render();
  }, [pdfDoc, pageNum]);

  function handleSearch() {
    const q = query.trim().toLowerCase();
    if (!q || pagesText.length === 0) return;
    const n = pagesText.length;
    for (let offset = 1; offset <= n; offset++) {
      const idx = (pageNum - 1 + offset) % n;
      const lower = pagesText[idx].toLowerCase();
      const pos = lower.indexOf(q);
      if (pos !== -1) {
        const start = Math.max(0, pos - 40);
        const end = Math.min(pagesText[idx].length, pos + q.length + 40);
        setHit({ halaman: idx + 1, cuplikan: `...${pagesText[idx].slice(start, end)}...` });
        setPageNum(idx + 1);
        return;
      }
    }
    setHit({ halaman: -1, cuplikan: 'Tidak ditemukan di dokumen ini.' });
  }

  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        {pdfFileNameTersimpan && (
          <p className="text-xs text-gray-500">
            File sebelumnya: <strong>{pdfFileNameTersimpan}</strong>. PDF tidak disimpan di aplikasi — pilih ulang
            filenya untuk melihat &amp; mencari di dalamnya.
          </p>
        )}
        <label className="cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Pilih File PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
              e.target.value = '';
            }}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="secondary" onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum <= 1}>
          ← Hal.
        </Button>
        <span className="text-gray-600">
          {pageNum} / {pdfDoc?.numPages ?? '?'}
        </span>
        <Button
          variant="secondary"
          onClick={() => setPageNum((p) => Math.min(pdfDoc?.numPages ?? p, p + 1))}
          disabled={!pdfDoc || pageNum >= pdfDoc.numPages}
        >
          Hal. →
        </Button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari di dalam dokumen..."
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <Button variant="secondary" onClick={handleSearch}>
          Cari
        </Button>
      </div>
      {hit && (
        <p className="text-xs text-gray-500">
          {hit.halaman > 0 ? `Ditemukan di halaman ${hit.halaman}: ${hit.cuplikan}` : hit.cuplikan}
        </p>
      )}
      {loading && <p className="text-sm text-gray-500">Memuat PDF...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex-1 overflow-auto rounded-md border border-gray-200 bg-gray-100 p-2">
        <canvas ref={canvasRef} className="mx-auto shadow" />
      </div>
    </div>
  );
}
