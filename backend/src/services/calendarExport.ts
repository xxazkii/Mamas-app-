import { createEvents } from 'ics';
import type { ParsedEvent } from '../types';

export function generateICS(events: ParsedEvent[], calendarName: string = 'Imported Timetable'): string {
  const icsEvents = events.map((event) => {
    const [startYear, startMonth, startDay] = event.startDate.split('-').map(Number);
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endYear, endMonth, endDay] = event.endDate.split('-').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);

    return {
      start: [startYear, startMonth, startDay, startHour, startMinute] as [number, number, number, number, number],
      end: [endYear, endMonth, endDay, endHour, endMinute] as [number, number, number, number, number],
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      recurrenceRule: event.recurrence || undefined,
      calName: calendarName,
    };
  });

  const { value, error } = createEvents(icsEvents);
  if (error) {
    throw new Error(`Failed to generate ICS: ${error}`);
  }
  return value || '';
}
