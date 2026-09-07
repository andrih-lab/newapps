import { useState, type ReactNode } from 'react';

interface Props {
  question: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Item FAQ/panduan yang bisa dibuka-tutup, dipakai di halaman Panduan & Troubleshooting. */
export function AccordionItem({ question, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-3 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-gray-900"
      >
        <span>{question}</span>
        <span className="shrink-0 text-lg leading-none text-gray-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-2 space-y-2 text-sm leading-relaxed text-gray-600">{children}</div>}
    </div>
  );
}
