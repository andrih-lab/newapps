import { useRef } from 'react';
import * as d3 from 'd3';
import type { BradfordResult } from '../../bibliometrics/bradford';
import { ChartExportButtons } from './ChartExportButtons';

const WIDTH = 480;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 32, left: 44 };
const ZONE_COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

export function BradfordChart({ result }: { result: BradfordResult }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { jurnal, jurnalPerZona, multiplier } = result;

  if (jurnal.length === 0) return null;

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = d3.scaleLog().domain([1, Math.max(2, jurnal.length)]).range([0, innerWidth]);
  const maxKumulatif = jurnal[jurnal.length - 1]?.kumulatifArtikel ?? 1;
  const y = d3.scaleLinear().domain([0, maxKumulatif]).range([innerHeight, 0]);

  const line = d3
    .line<{ peringkat: number; kumulatifArtikel: number }>()
    .x((d) => x(d.peringkat))
    .y((d) => y(d.kumulatifArtikel));

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hukum Bradford</h2>
        <ChartExportButtons svgRef={svgRef} filenameBase="hukum-bradford" csvRows={jurnal} />
      </div>
      <p className="mb-2 text-xs text-gray-500">
        Zona: {jurnalPerZona.join(' / ')} jurnal. Multiplier rata-rata antar zona: {multiplier.toFixed(2)}.
      </p>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-lg">
        <rect width={WIDTH} height={HEIGHT} fill="#ffffff" />
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {x.ticks(5).map((t) => (
            <text key={`x-${t}`} x={x(t)} y={innerHeight + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
              {Math.round(t)}
            </text>
          ))}
          {y.ticks(5).map((t) => (
            <text key={`y-${t}`} x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="#6b7280">
              {t}
            </text>
          ))}
          <path d={line(jurnal) ?? ''} fill="none" stroke="#4f46e5" strokeWidth={2} />
          {jurnal.map((j) => (
            <circle
              key={j.peringkat}
              cx={x(j.peringkat)}
              cy={y(j.kumulatifArtikel)}
              r={2.5}
              fill={ZONE_COLORS[(j.zona - 1) % ZONE_COLORS.length]}
            />
          ))}
        </g>
      </svg>
      <p className="mt-1 text-xs text-gray-400">Sumbu-x logaritmik (peringkat jurnal), sumbu-y kumulatif jumlah artikel.</p>
    </section>
  );
}
