import { useRef } from 'react';
import * as d3 from 'd3';
import type { AnnualProductionPoint } from '../../bibliometrics/annualProduction';
import { ChartExportButtons } from './ChartExportButtons';

const WIDTH = 720;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 32, left: 44 };

export function AnnualProductionChart({ data }: { data: AnnualProductionPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length === 0) return null;

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = d3
    .scaleBand<number>()
    .domain(data.map((d) => d.tahun))
    .range([0, innerWidth])
    .padding(0.2);
  const maxY = d3.max(data, (d) => d.jumlah) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([0, maxY * 1.1 || 1])
    .range([innerHeight, 0]);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Produksi Tahunan</h2>
        <ChartExportButtons svgRef={svgRef} filenameBase="produksi-tahunan" csvRows={data} />
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-3xl">
        <rect width={WIDTH} height={HEIGHT} fill="#ffffff" />
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(5).map((t) => (
            <g key={t}>
              <line x1={0} x2={innerWidth} y1={y(t)} y2={y(t)} stroke="#e5e7eb" />
              <text x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill="#6b7280">
                {t}
              </text>
            </g>
          ))}
          {data.map((d) => (
            <rect
              key={d.tahun}
              x={x(d.tahun)}
              y={y(d.jumlah)}
              width={x.bandwidth()}
              height={Math.max(0, innerHeight - y(d.jumlah))}
              fill="#4f46e5"
            />
          ))}
          {data.map((d) => (
            <text
              key={`label-${d.tahun}`}
              x={(x(d.tahun) ?? 0) + x.bandwidth() / 2}
              y={innerHeight + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {d.tahun}
            </text>
          ))}
        </g>
      </svg>
    </section>
  );
}
