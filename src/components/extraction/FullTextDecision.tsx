import { useState } from 'react';
import type { Criterion, StatusSkrining } from '../../types/record';
import { ExclusionLabelPicker } from '../screening/ExclusionLabelPicker';
import { Button } from '../common/Button';

interface Props {
  status: StatusSkrining;
  labelEksklusi: string | null;
  criteriaEksklusi: Criterion[];
  onDecide: (keputusan: 'masuk' | 'tolak', label: string | null) => void;
  onReset: () => void;
}

/** Kelayakan full teks, dicatat terpisah dari skrining abstrak — angkanya masuk ke PRISMA (Bagian 4, Modul 5). */
export function FullTextDecision({ status, labelEksklusi, criteriaEksklusi, onDecide, onReset }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (status === 'termasuk') {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3 text-sm">
        <span className="text-green-800">Disertakan dalam sintesis (lolos full teks).</span>
        <button onClick={onReset} className="text-xs text-green-700 underline">
          Batalkan
        </button>
      </div>
    );
  }

  if (status === 'dikecualikan') {
    return (
      <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm">
        <span className="text-red-800">Dieksklusi: {labelEksklusi ?? '(tanpa label)'}</span>
        <button onClick={onReset} className="text-xs text-red-700 underline">
          Batalkan
        </button>
      </div>
    );
  }

  if (showPicker) {
    return (
      <ExclusionLabelPicker
        labels={criteriaEksklusi}
        onPick={(label) => {
          onDecide('tolak', label);
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => onDecide('masuk', null)}>Sertakan (lolos full teks)</Button>
      <Button variant="danger" onClick={() => setShowPicker(true)}>
        Eksklusi
      </Button>
    </div>
  );
}
