interface Props {
  text: string;
  terms: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sorot kata kunci kriteria di dalam abstrak (Bagian 4, Modul 4c). */
export function HighlightedAbstract({ text, terms }: Props) {
  if (!text) return <p className="text-sm text-gray-400">(tidak ada abstrak)</p>;
  if (terms.length === 0) return <p className="whitespace-pre-wrap text-sm text-gray-700">{text}</p>;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);
  const termSet = new Set(terms.map((t) => t.toLowerCase()));

  return (
    <p className="whitespace-pre-wrap text-sm text-gray-700">
      {parts.map((part, i) =>
        termSet.has(part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-amber-200 px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}
