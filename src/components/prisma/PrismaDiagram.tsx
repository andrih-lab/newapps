import { useRef } from 'react';
import type { PrismaCounts } from '../../prisma/computePrisma';
import { downloadPng, downloadSvg } from '../../lib/exportPng';
import { downloadSvgAsPdf } from '../../lib/exportPdf';

const WIDTH = 760;
const MAIN_X = 30;
const MAIN_W = 360;
const SIDE_X = 430;
const SIDE_W = 300;
const ROW_H = 74;
const GAP = 56;
const SIDE_H = 60;

interface Row {
  key: string;
  title: string;
  count: number;
  sub?: string;
}

function boxY(rowIndex: number): number {
  return 20 + rowIndex * (ROW_H + GAP);
}

function FlowBox({ x, y, w, h, title, count, sub, tone = 'main' }: { x: number; y: number; w: number; h: number; title: string; count: number; sub?: string; tone?: 'main' | 'side' }) {
  const fill = tone === 'main' ? '#eef2ff' : '#fef2f2';
  const stroke = tone === 'main' ? '#4f46e5' : '#ef4444';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + 12} y={y + 20} fontSize={11} fontWeight={600} fill="#1f2937">
        {title}
      </text>
      <text x={x + 12} y={y + 40} fontSize={16} fontWeight={700} fill="#111827">
        n = {count}
      </text>
      {sub && (
        <text x={x + 12} y={y + h - 10} fontSize={9} fill="#6b7280">
          {sub}
        </text>
      )}
    </g>
  );
}

export function PrismaDiagram({ counts }: { counts: PrismaCounts }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const mainRows: Row[] = [
    { key: 'identifikasi', title: 'Identifikasi — record ditemukan', count: counts.identifikasi.total },
    { key: 'disaring', title: 'Disaring (judul & abstrak)', count: counts.disaring },
    {
      key: 'fulltext',
      title: 'Dinilai kelayakan full teks',
      count: counts.dinilaiFullText,
      sub: counts.belumDinilaiFullText > 0 ? `${counts.belumDinilaiFullText} belum diputuskan` : undefined,
    },
    { key: 'disertakan', title: 'Disertakan dalam sintesis', count: counts.disertakan },
  ];

  const sideRows = [
    { title: 'Duplikat dibuang', count: counts.duplikatDibuang, afterRow: 0 },
    { title: 'Dieksklusi (skrining abstrak)', count: counts.dieksklusiSkrining.total, afterRow: 1 },
    { title: 'Dieksklusi (full teks)', count: counts.dieksklusiFullText.total, afterRow: 2 },
  ];

  const height = boxY(mainRows.length - 1) + ROW_H + 20;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Diagram PRISMA 2020</h2>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => svgRef.current && downloadPng('prisma.png', svgRef.current)}
            className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
          >
            PNG
          </button>
          <button
            onClick={() => svgRef.current && downloadSvg('prisma.svg', svgRef.current)}
            className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
          >
            SVG
          </button>
          <button
            onClick={() => svgRef.current && downloadSvgAsPdf('prisma.pdf', svgRef.current)}
            className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50"
          >
            PDF
          </button>
        </div>
      </div>

      {counts.belumDinilai > 0 && (
        <p className="mb-1 text-xs text-amber-600">
          {counts.belumDinilai} record belum dinilai di halaman Skrining — angka pada tahap berikutnya masih
          bisa berubah.
        </p>
      )}
      {counts.belumDinilaiFullText > 0 && (
        <p className="mb-2 text-xs text-amber-600">
          {counts.belumDinilaiFullText} record lolos skrining abstrak tapi belum dinilai kelayakan full
          teksnya di halaman Full Teks & Ekstraksi — angka "disertakan" di bawah masih bisa berubah.
        </p>
      )}

      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${height}`} className="w-full max-w-3xl">
        <rect width={WIDTH} height={height} fill="#ffffff" />
        <defs>
          <marker id="prisma-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
        </defs>

        {mainRows.map((row, i) => (
          <FlowBox key={row.key} x={MAIN_X} y={boxY(i)} w={MAIN_W} h={ROW_H} title={row.title} count={row.count} sub={row.sub} />
        ))}

        {mainRows.slice(0, -1).map((_, i) => (
          <line
            key={`arrow-${i}`}
            x1={MAIN_X + MAIN_W / 2}
            y1={boxY(i) + ROW_H}
            x2={MAIN_X + MAIN_W / 2}
            y2={boxY(i + 1)}
            stroke="#6b7280"
            strokeWidth={1.5}
            markerEnd="url(#prisma-arrow)"
          />
        ))}

        {sideRows.map((side, i) => {
          const branchY = boxY(side.afterRow) + ROW_H + GAP / 2;
          const sideY = branchY - SIDE_H / 2;
          return (
            <g key={`side-${i}`}>
              <line
                x1={MAIN_X + MAIN_W}
                y1={branchY}
                x2={SIDE_X}
                y2={branchY}
                stroke="#ef4444"
                strokeWidth={1.5}
                markerEnd="url(#prisma-arrow)"
              />
              <FlowBox x={SIDE_X} y={sideY} w={SIDE_W} h={SIDE_H} title={side.title} count={side.count} tone="side" />
            </g>
          );
        })}
      </svg>
    </section>
  );
}
