import { HeadingLevel, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';

export function h1(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
}

export function h2(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
}

export function p(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });
}

export function pBold(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { after: 80 } });
}

export function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    width: { size: 100, type: WidthType.AUTO },
  });
}

/** Tabel sederhana dengan baris header tebal, dipakai di Bab Hasil (Bagian 4, Modul 7). */
export function simpleTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

export function formatTanggal(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
