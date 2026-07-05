import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  rows: unknown[][];
}

export function readExcelFile(buffer: Buffer): SheetData[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false });
  return workbook.SheetNames.map((name: string) => {
    const sheet = workbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: true,
      defval: '',
    }) as unknown[][];
    return { name, rows: json };
  });
}

export function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    // Handle Excel date serial numbers
    if (value > 30000 && value < 60000) {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return String(value).trim();
}

export function detectHeaderRow(rows: unknown[][]): number {
  if (rows.length === 0) return 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map(normalizeValue).filter(Boolean);
    const textCount = cells.filter((c) => /[a-zA-Z]/.test(c)).length;
    if (textCount > 0 && textCount / cells.length > 0.5) return i;
  }
  return 0;
}

export function rowsToObjects(rows: unknown[][], headerRow: number): Record<string, unknown>[] {
  if (headerRow >= rows.length) return [];
  const headers = rows[headerRow].map(normalizeValue);
  return rows.slice(headerRow + 1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = row[idx];
    });
    return obj;
  });
}

export function extractAllCells(rows: unknown[][]): string[] {
  return rows
    .flat()
    .map(normalizeValue)
    .filter((c) => c.length > 0);
}
