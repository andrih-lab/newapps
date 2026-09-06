interface Props {
  /** Log keputusan terurut kronologis (lama -> baru). */
  logs: Array<{ keputusan: 'masuk' | 'tolak' | 'ragu' }>;
}

const WIDTH = 240;
const HEIGHT = 60;

/** Kurva penemuan relevan: kumulatif "masuk" terhadap jumlah dinilai (indikator berhenti, Bagian 4, Modul 4b). */
export function DiscoveryCurve({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-xs text-gray-400">Belum ada keputusan.</p>;
  }

  let cumulative = 0;
  const points = logs.map((l, i) => {
    if (l.keputusan === 'masuk') cumulative++;
    return { x: i + 1, y: cumulative };
  });

  const maxX = points.length;
  const maxY = Math.max(1, cumulative);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x / maxX) * WIDTH} ${HEIGHT - (p.y / maxY) * HEIGHT}`)
    .join(' ');

  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">
        Kurva penemuan relevan ({cumulative} "masuk" dari {logs.length} dinilai)
      </p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-xs">
        <rect width={WIDTH} height={HEIGHT} fill="#f9fafb" />
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
