import { v4 as uuid } from 'uuid';
import type { ParsedEvent } from '../types';
import { normalizeValue } from './excelParser';

const DAY_NAMES = [
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function isDayName(cell: unknown): boolean {
  return DAY_NAMES.includes(normalizeValue(cell).toLowerCase());
}

function findDayNamesRow(rows: unknown[][]): { rowIndex: number; columns: number[] } | null {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const columns: number[] = [];
    rows[i].forEach((cell, idx) => {
      if (isDayName(cell)) columns.push(idx);
    });
    if (columns.length >= 5) return { rowIndex: i, columns };
  }
  return null;
}

function parseDateFromCell(cell: unknown): string | null {
  const text = normalizeValue(cell);
  if (!text) return null;

  // Already normalized to YYYY-MM-DD by Excel serial number handling
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  // Try to parse other date formats
  const date = new Date(text);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return null;
}

function isWeekHeaderRow(row: unknown[], dayColumns: number[]): boolean {
  const dateCount = dayColumns.filter((col) => parseDateFromCell(row[col]) !== null).length;
  return dateCount >= dayColumns.length / 2;
}

function findMonthYear(rows: unknown[][], fallbackYear: number): { year: number; month: number } | null {
  const monthRe = new RegExp(`(${MONTH_NAMES.join('|')})`, 'i');
  for (const row of rows) {
    for (const cell of row) {
      const text = normalizeValue(cell);
      const monthMatch = text.match(monthRe);
      const yearMatch = text.match(/(\d{4})/);
      if (monthMatch && yearMatch) {
        const month = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthMatch[1].toLowerCase()) + 1;
        return { year: parseInt(yearMatch[1], 10), month };
      }
    }
  }
  return { year: fallbackYear, month: new Date().getMonth() + 1 };
}

export function parseCalendarGrid(
  sheet: { name: string; rows: unknown[][] },
  fallbackYear: number
): { events: ParsedEvent[]; warnings: string[] } {
  const events: ParsedEvent[] = [];
  const warnings: string[] = [];

  const dayNames = findDayNamesRow(sheet.rows);
  if (dayNames === null) return { events, warnings };

  const monthYear = findMonthYear(sheet.rows, fallbackYear);
  if (!monthYear) {
    warnings.push(`Sheet "${sheet.name}": could not determine month/year for the calendar grid.`);
    return { events, warnings };
  }

  const dayColumns = dayNames.columns;
  let currentWeekDates: (string | null)[] = [];

  for (let i = dayNames.rowIndex + 1; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    if (!row || row.length === 0) continue;

    if (isWeekHeaderRow(row, dayColumns)) {
      currentWeekDates = dayColumns.map((col) => parseDateFromCell(row[col]));
      continue;
    }

    for (const col of dayColumns) {
      const text = normalizeValue(row[col]).replace(/\s+/g, ' ');
      if (!text || /^\d{1,2}$/.test(text)) continue;
      // Skip labels that are not event titles
      if (isDayName(text)) continue;
      if (text.length < 2) continue;

      const dateStr = currentWeekDates[dayColumns.indexOf(col)];
      if (!dateStr) continue;

      events.push({
        id: uuid(),
        title: text,
        startDate: dateStr,
        endDate: dateStr,
        startTime: '09:00',
        endTime: '10:00',
        timezone: 'Europe/London',
        confidence: 70,
        warnings: [],
        raw: { column: col, text, date: dateStr },
      });
    }
  }

  return { events, warnings };
}
