import { useRef } from 'react';
import * as d3 from 'd3';
import type { KeywordTrendSeries } from '../../bibliometrics/keywordTrends';
import { ChartExportButtons } from './ChartExportButtons';

const WIDTH = 720;
const HEIGHT = 360;
const MARGIN = { top: 20, right: 140, bottom: 32, left: 44 };
const COLORS = d3.schemeTableau10;

export function KeywordTrendChart({ series }: { series: KeywordTrendSeries[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (series.length === 0) return null;

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const allYears = Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.tahun)))).sort((a, b) => a - b);
  const allCounts = series.flatMap((s) => s.data.map((d) => d.jumlah));

  const x = d3
    .scaleLinear()
    .domain((d3.extent(allYears) as [number, number]) ?? [0, 1])
    .range([0, innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(allCounts) ?? 1])
    .range([innerHeight, 0]);

  const line = d3
    .line<{ tahun: number; jumlah: number }>()
    .x((d) => x(d.tahun))
    .y((d) => y(d.jumlah));

  const csvRows = allYears.map((tahun) => {
    const row: Record<string, unknown> = { tahun };
    for (const s of series) {
      row[s.kataKunci] = s.data.find((d) => d.tahun === tahun)?.jumlah ?? 0;
    }
    return row;
  });

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tren Kata Kunci per Tahun</h2>
        <ChartExportButtons svgRef={svgRef} filenameBase="tren-kata-kunci" csvRows={csvRows} />
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-4xl">
        <rect width={WIDTH} height={HEIGHT} fill="#ffffff" />
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {x.ticks(Math.min(allYears.length, 8)).map((t) => (
            <text key={`x-${t}`} x={x(t)} y={innerHeight + 16} textAnchor="middle" fontSize={10} fill="#6b7280">
              {Math.round(t)}
            </text>
          ))}
          {y.ticks(5).map((t) => (
            <g key={`y-${t}`}>
              <line x1={0} x2={innerWidth} y1={y(t)} y2={y(t)} stroke="#f3f4f6" />
              <text x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="#6b7280">
                {t}
              </text>
            </g>
          ))}
          {series.map((s, i) => (
            <path key={s.kataKunci} d={line(s.data) ?? ''} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
          ))}
          <g transform={`translate(${innerWidth + 12}, 0)`}>
            {series.map((s, i) => (
              <g key={s.kataKunci} transform={`translate(0, ${i * 16})`}>
                <rect width={10} height={10} fill={COLORS[i % COLORS.length]} />
                <text x={14} y={9} fontSize={10} fill="#374151">
                  {s.kataKunci}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </section>
  );
}
