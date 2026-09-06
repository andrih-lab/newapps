interface Props {
  /** Nilai 0..1. */
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="w-full">
      {label && <div className="mb-1 text-xs text-gray-600">{label}</div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
