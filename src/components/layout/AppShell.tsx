import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-indigo-700">
            Telaah
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/proyek" className="text-gray-600 hover:text-indigo-700">
              Proyek Saya
            </Link>
            <Link to="/panduan" className="text-gray-600 hover:text-indigo-700">
              Panduan
            </Link>
            <Link to="/metodologi" className="text-gray-600 hover:text-indigo-700">
              Metodologi
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
