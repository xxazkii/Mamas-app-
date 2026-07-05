import { v4 as uuid } from 'uuid';
import type { ParsedEvent } from '../types';
import { detectHeaderRow, normalizeValue, rowsToObjects } from './excelParser';
import { parseCalendarGrid } from './gridParser';

const TIME_RE = /(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?/g;
const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/;
const DATE_LIKE_RE = /^(\d{4})-(\d{2})-(\d{2})$|^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/;

function to24h(hours: number, ampm?: string): number {
  if (ampm?.toLowerCase() === 'pm' && hours !== 12) hours += 12;
  if (ampm?.toLowerCase() === 'am' && hours === 12) hours = 0;
  return hours;
}

function parseTime(value: unknown): { start: string; end: string } | null {
  const text = normalizeValue(value).replace(/\s+/g, ' ');
  const matches = [...text.matchAll(TIME_RE)];
  if (matches.length === 0) return null;

  const format = (hours: number, minutes: string) => `${String(hours).padStart(2, '0')}:${minutes}`;

  if (matches.length >= 2) {
    const startHours = to24h(parseInt(matches[0][1], 10), matches[0][3]);
    const endHours = to24h(parseInt(matches[1][1], 10), matches[1][3]);
    return {
      start: format(startHours, matches[0][2]),
      end: format(endHours, matches[1][2]),
    };
  }

  // Single time only: assume 1-hour duration
  const hours = to24h(parseInt(matches[0][1], 10), matches[0][3]);
  const endHours = (hours + 1) % 24;
  return {
    start: format(hours, matches[0][2]),
    end: format(endHours, matches[0][2]),
  };
}

function parseDate(value: unknown, fallbackYear: number): string | null {
  const text = normalizeValue(value);
  const match = text.match(DATE_RE);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(text);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return null;
}

function isDateLike(value: unknown): boolean {
  return DATE_LIKE_RE.test(normalizeValue(value));
}

function findBestTitleColumn(obj: Record<string, unknown>): string | null {
  const candidates = Object.keys(obj).filter((k) => {
    const lower = k.toLowerCase();
    return lower.includes('event') || lower.includes('title') || lower.includes('name') || lower.includes('lecture') || lower.includes('module') || lower.includes('subject') || lower.includes('activity') || lower.includes('session') || lower.includes('class') || lower.includes('course') || lower.includes('shift') || lower.includes('appointment');
  });
  if (candidates[0]) return candidates[0];

  // Prefer a column whose first value is not a plain date
  const nonDateKey = Object.keys(obj).find((k) => {
    const val = normalizeValue(obj[k]);
    return val && !isDateLike(val);
  });
  return nonDateKey || Object.keys(obj)[0] || null;
}

function findColumn(obj: Record<string, unknown>, keywords: string[]): string | null {
  return (
    Object.keys(obj).find((k) => {
      const lower = k.toLowerCase();
      return keywords.some((kw) => lower.includes(kw));
    }) || null
  );
}

export function parseEventsWithRules(
  sheets: { name: string; rows: unknown[][] }[],
  fallbackYear: number = new Date().getFullYear()
): { events: ParsedEvent[]; warnings: string[] } {
  const events: ParsedEvent[] = [];
  const warnings: string[] = [];

  for (const sheet of sheets) {
    // Try calendar-grid layout first (e.g. monthly calendars with Mon-Sun headers)
    const gridResult = parseCalendarGrid(sheet, fallbackYear);
    if (gridResult.events.length > 0) {
      events.push(...gridResult.events);
      warnings.push(...gridResult.warnings);
      continue;
    }

    const headerRow = detectHeaderRow(sheet.rows);
    const objects = rowsToObjects(sheet.rows, headerRow);
    if (objects.length === 0) {
      warnings.push(`Sheet "${sheet.name}" appears to be empty or has no detectable data.`);
      continue;
    }

    const titleCol = findBestTitleColumn(objects[0]);
    const dateCol = findColumn(objects[0], ['date', 'day', 'start']);
    const timeCol = findColumn(objects[0], ['time', 'start time', 'from']);
    const locationCol = findColumn(objects[0], ['room', 'location', 'venue', 'place', 'building']);
    const descCol = findColumn(objects[0], ['notes', 'description', 'detail', 'info', 'tutor', 'teacher', 'staff']);

    if (!titleCol) {
      warnings.push(`Sheet "${sheet.name}": could not identify an event title column.`);
      continue;
    }

    for (const row of objects) {
      const title = normalizeValue(row[titleCol]);
      if (!title) continue;

      const date = dateCol ? parseDate(row[dateCol], fallbackYear) : null;
      const time = timeCol ? parseTime(row[timeCol]) : null;

      // If the title looks like a date and there is no other event info, skip the row
      if (isDateLike(title) && !date && !time) continue;

      // Skip empty days: require at least a date or time to be present
      if (!date && !time) continue;

      const event: ParsedEvent = {
        id: uuid(),
        title,
        startDate: date || `${fallbackYear}-01-01`,
        endDate: date || `${fallbackYear}-01-01`,
        startTime: time?.start || '09:00',
        endTime: time?.end || '10:00',
        location: locationCol ? normalizeValue(row[locationCol]) : undefined,
        description: descCol ? normalizeValue(row[descCol]) : undefined,
        timezone: 'Europe/London',
        confidence: date && time ? 85 : 50,
        warnings: [],
        raw: row,
      };

      if (!date) event.warnings.push('Could not detect a date');
      if (!time) event.warnings.push('Could not detect a time');
      events.push(event);
    }
  }

  return { events, warnings };
}
