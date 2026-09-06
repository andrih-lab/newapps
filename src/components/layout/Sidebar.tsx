import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: 'impor', label: 'Impor Data' },
  { to: 'deduplikasi', label: 'Deduplikasi' },
  { to: 'bibliometrik', label: 'Bibliometrik' },
  { to: 'kriteria', label: 'Kriteria' },
  { to: 'skrining', label: 'Skrining' },
  { to: 'prisma', label: 'PRISMA' },
  { to: 'ekspor', label: 'Ekspor' },
];

export function Sidebar() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 text-sm sm:w-48 sm:shrink-0 sm:flex-col sm:gap-1 sm:overflow-visible sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-md px-3 py-2 font-medium ${
              isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
