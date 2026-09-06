import { useRef } from 'react';
import * as d3 from 'd3';
import type { LotkaResult } from '../../bibliometrics/lotka';
import { ChartExportButtons } from './ChartExportButtons';

const WIDTH = 480;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 32, left: 44 };

export function LotkaChart({ result }: { result: LotkaResult }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { titik, eksponen, konstanta } = result;

  if (titik.length === 0) return null;

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const maxN = d3.max(titik, (d) => d.jumlahPublikasi) ?? 1;
  const maxA = d3.max(titik, (d) => d.jumlahPenulisAktual) ?? 1;

  const x = d3.scaleLog().domain([1, Math.max(2, maxN)]).range([0, innerWidth]);
  const y = d3.scaleLog().domain([1, Math.max(2, maxA)]).range([innerHeight, 0]);

  const lineTeoritis = d3
    .line<{ n: number; a: number }>()
    .x((d) => x(d.n))
    .y((d) => y(Math.max(1, d.a)));

  const teoritisPoints = titik.map((t) => ({ n: t.jumlahPublikasi, a: t.jumlahPenulisTeoritis }));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hukum Lotka</h2>
        <ChartExportButtons svgRef={svgRef} filenameBase="hukum-lotka" csvRows={titik} />
      </div>
      <p className="mb-2 text-xs text-gray-500">
        Eksponen hasil estimasi data: {eksponen.toFixed(2)} (teoritis Lotka = 2,00). Konstanta A1 estimasi:{' '}
        {konstanta.toFixed(1)}.
      </p>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-lg">
        <rect width={WIDTH} height={HEIGHT} fill="#ffffff" />
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {x.ticks(5).map((t) => (
            <text key={`x-${t}`} x={x(t)} y={innerHeight + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
              {t}
            </text>
          ))}
          {y.ticks(5).map((t) => (
            <text key={`y-${t}`} x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="#6b7280">
              {t}
            </text>
          ))}
          <path d={lineTeoritis(teoritisPoints) ?? ''} fill="none" stroke="#9ca3af" strokeDasharray="4 3" strokeWidth={1.5} />
          {titik.map((t) => (
            <circle
              key={t.jumlahPublikasi}
              cx={x(t.jumlahPublikasi)}
              cy={y(Math.max(1, t.jumlahPenulisAktual))}
              r={4}
              fill="#4f46e5"
            />
          ))}
        </g>
      </svg>
      <p className="mt-1 text-xs text-gray-400">
        Sumbu log-log. Titik biru = data aktual, garis putus-putus = kurva teoritis Lotka (C=2).
      </p>
    </section>
  );
}
