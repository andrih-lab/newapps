import { useEffect, useRef } from 'react';
import cytoscape, { type Core, type EdgeSingular, type NodeSingular } from 'cytoscape';
import type { NetworkResult } from '../../bibliometrics/network';
import { downloadBlob, downloadCsv, toCsv } from '../../lib/exportCsv';

interface Props {
  title: string;
  data: NetworkResult;
  filenameBase: string;
}

/**
 * Render jaringan co-occurrence dengan Cytoscape.js. Dipakai bersama oleh
 * jaringan co-word kata kunci dan co-authorship penulis/negara (Bagian 4,
 * Modul 3) agar logikanya tidak diduplikasi.
 */
export function NetworkGraph({ title, data, filenameBase }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    const maxNodeWeight = Math.max(1, ...data.nodes.map((n) => n.weight));
    const maxEdgeWeight = Math.max(1, ...data.edges.map((e) => e.weight));

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...data.nodes.map((n) => ({ data: { id: n.id, label: n.label, weight: n.weight } })),
        ...data.edges.map((e) => ({
          data: { id: `${e.source}__${e.target}`, source: e.source, target: e.target, weight: e.weight },
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#4f46e5',
            label: 'data(label)',
            'font-size': 8,
            color: '#374151',
            'text-valign': 'bottom',
            'text-halign': 'center',
            width: (ele: NodeSingular) => 10 + 28 * (ele.data('weight') / maxNodeWeight),
            height: (ele: NodeSingular) => 10 + 28 * (ele.data('weight') / maxNodeWeight),
          },
        },
        {
          selector: 'edge',
          style: {
            width: (ele: EdgeSingular) => 1 + 5 * (ele.data('weight') / maxEdgeWeight),
            'line-color': '#c7d2fe',
            'curve-style': 'haystack',
          },
        },
      ],
      layout: { name: 'cose', animate: false },
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [data]);

  function handlePng() {
    const cy = cyRef.current;
    if (!cy) return;
    const blob = cy.png({ full: true, scale: 2, output: 'blob' }) as unknown as Blob;
    downloadBlob(`${filenameBase}.png`, blob);
  }

  function handleCsv() {
    downloadCsv(`${filenameBase}-edges.csv`, toCsv(data.edges as unknown as Array<Record<string, unknown>>));
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2 text-xs">
          <button onClick={handlePng} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
            PNG
          </button>
          <button onClick={handleCsv} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
            CSV (edge)
          </button>
        </div>
      </div>
      {data.nodes.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada data.</p>
      ) : (
        <div ref={containerRef} style={{ height: 360 }} />
      )}
    </div>
  );
}
