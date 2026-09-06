import { useState, type RefObject } from 'react';
import { downloadPng, downloadSvg } from '../../lib/exportPng';
import { downloadCsv, toCsv } from '../../lib/exportCsv';

interface Props {
  svgRef: RefObject<SVGSVGElement | null>;
  filenameBase: string;
  csvRows?: ReadonlyArray<object>;
}

/** Tombol unduh PNG/SVG/CSV yang dipakai di semua grafik Modul 3 (Bagian 4). */
export function ChartExportButtons({ svgRef, filenameBase, csvRows }: Props) {
  const [busy, setBusy] = useState(false);

  async function handlePng() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      await downloadPng(`${filenameBase}.png`, svgRef.current);
    } finally {
      setBusy(false);
    }
  }

  function handleSvg() {
    if (!svgRef.current) return;
    downloadSvg(`${filenameBase}.svg`, svgRef.current);
  }

  function handleCsv() {
    if (!csvRows) return;
    downloadCsv(`${filenameBase}.csv`, toCsv(csvRows));
  }

  return (
    <div className="flex gap-2 text-xs">
      <button onClick={handlePng} disabled={busy} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
        PNG
      </button>
      <button onClick={handleSvg} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
        SVG
      </button>
      {csvRows && (
        <button onClick={handleCsv} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
          CSV
        </button>
      )}
    </div>
  );
}
