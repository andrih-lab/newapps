import { useState, type ReactNode } from 'react';

export interface VirtualizedTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  width?: string;
}

interface Props<T> {
  items: T[];
  columns: Array<VirtualizedTableColumn<T>>;
  getRowKey: (item: T) => string;
  rowHeight?: number;
  height?: number;
}

/**
 * Tabel virtualisasi sederhana (tanpa dependency eksternal): hanya baris yang
 * terlihat di viewport yang dirender ke DOM. Wajib dipakai untuk daftar
 * record yang bisa mencapai ribuan baris (Catatan Bagian 9).
 */
export function VirtualizedTable<T>({ items, columns, getRowKey, rowHeight = 40, height = 480 }: Props<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const overscan = 6;

  const visibleCount = Math.ceil(height / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex);

  const totalHeight = items.length * rowHeight;
  const offsetY = startIndex * rowHeight;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      <div className="flex border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-600">
        {columns.map((col) => (
          <div key={col.key} className="truncate px-3 py-2" style={{ width: col.width ?? `${100 / columns.length}%` }}>
            {col.header}
          </div>
        ))}
      </div>
      <div className="overflow-y-auto" style={{ height }} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
            {visibleItems.map((item) => (
              <div
                key={getRowKey(item)}
                className="flex border-b border-gray-100 text-sm"
                style={{ height: rowHeight }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center truncate px-3"
                    style={{ width: col.width ?? `${100 / columns.length}%` }}
                  >
                    {col.render(item)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
