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

function findDayNamesRow(rows: unknown[][]): number | null {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const matches = rows[i].filter(isDayName).length;
    if (matches >= 5) return i;
  }
  return null;
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

function parseDayNumber(cell: unknown): number | null {
  const text = normalizeValue(cell);
  const match = text.match(/^\d{1,2}$/);
  return match ? parseInt(match[0], 10) : null;
}

function isWeekHeaderRow(row: unknown[]): boolean {
  const numbers = row.filter((cell) => parseDayNumber(cell) !== null).length;
  return numbers >= 5;
}

function buildWeekDates(row: unknown[], baseYear: number, baseMonth: number): (Date | null)[] {
  const days: (number | null)[] = row.map(parseDayNumber);
  let currentMonth = baseMonth;
  let currentYear = baseYear;

  // If the first numbered day is high (>20), the week starts in the previous month
  const firstDay = days.find((d) => d !== null);
  if (firstDay && firstDay > 20) {
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
  }

  let prevDay: number | null = firstDay ?? null;

  return days.map((day) => {
    if (day === null) return null;

    if (prevDay !== null && day < prevDay && day <= 5) {
      // Month rolled over within the week
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    prevDay = day;
    return new Date(Date.UTC(currentYear, currentMonth - 1, day));
  });
}

export function parseCalendarGrid(
  sheet: { name: string; rows: unknown[][] },
  fallbackYear: number
): { events: ParsedEvent[]; warnings: string[] } {
  const events: ParsedEvent[] = [];
  const warnings: string[] = [];

  const dayNamesRow = findDayNamesRow(sheet.rows);
  if (dayNamesRow === null) return { events, warnings };

  const monthYear = findMonthYear(sheet.rows, fallbackYear);
  if (!monthYear) {
    warnings.push(`Sheet "${sheet.name}": could not determine month/year for the calendar grid.`);
    return { events, warnings };
  }

  let currentWeekDates: (Date | null)[] = [];

  for (let i = dayNamesRow + 1; i < sheet.rows.length; i++) {
    const row = sheet.rows[i];
    if (!row || row.length === 0) continue;

    if (isWeekHeaderRow(row)) {
      currentWeekDates = buildWeekDates(row, monthYear.year, monthYear.month);
      continue;
    }

    for (let col = 0; col < row.length; col++) {
      const text = normalizeValue(row[col]);
      if (!text || /^\d{1,2}$/.test(text)) continue;

      const date = currentWeekDates[col];
      if (!date) continue;

      const dateStr = date.toISOString().split('T')[0];
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
