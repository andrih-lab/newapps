import { useState } from 'react';
import type { StringBasisData } from '../../keywords/buildQueries';
import { Button } from '../common/Button';

interface Props {
  strings: StringBasisData[];
  totalOpenAlex?: { nilai: number; stringQuery: string };
  busyHitung: boolean;
  onHitungTotal: () => void;
  onPakaiDiImpor: (query: string) => void;
}

const fmt = new Intl.NumberFormat('id-ID');

function TombolSalin({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = useState(false);
  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 1500);
    } catch {
      window.prompt('Salin manual (Ctrl+C):', teks);
    }
  }
  return (
    <Button type="button" variant="secondary" onClick={salin} className="shrink-0 !py-1 text-xs">
      {tersalin ? '✓ Tersalin' : 'Salin'}
    </Button>
  );
}

export function QueryOutputs({ strings, totalOpenAlex, busyHitung, onHitungTotal, onPakaiDiImpor }: Props) {
  if (strings.length === 0) {
    return <p className="text-sm text-gray-500">Centang minimal satu istilah di tiap konsep untuk membentuk string pencarian.</p>;
  }

  return (
    <div className="space-y-3">
      {strings.map((s) => {
        const totalSegar = s.basisData === 'openalex' && totalOpenAlex && totalOpenAlex.stringQuery === s.string;
        return (
          <div key={s.basisData} className="rounded-md border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{s.label}</h3>
              <div className="flex items-center gap-2">
                {s.basisData === 'openalex' && (
                  <>
                    {totalSegar && (
                      <span className="text-xs text-gray-600">
                        <strong className="tabular-nums">{fmt.format(totalOpenAlex.nilai)}</strong> hasil
                      </span>
                    )}
                    <Button type="button" variant="ghost" onClick={onHitungTotal} disabled={busyHitung} className="!py-1 text-xs">
                      {busyHitung ? 'Menghitung…' : 'Hitung hasil'}
                    </Button>
                    <Button type="button" onClick={() => onPakaiDiImpor(s.string)} className="!py-1 text-xs">
                      Cari &amp; Impor →
                    </Button>
                  </>
                )}
                <TombolSalin teks={s.string} />
              </div>
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-gray-50 p-2 font-mono text-xs text-gray-800">{s.string}</pre>
            {s.catatan.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-500">
                {s.catatan.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
