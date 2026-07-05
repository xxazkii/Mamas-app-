import { readExcelFile } from './excelParser';
import { parseEventsWithRules } from './ruleParser';
import { parseEventsWithAI } from './aiParser';
import type { ParsedEvent } from '../types';

export async function parseExcelFile(
  buffer: Buffer,
  useAI: boolean = true,
  fallbackYear: number = new Date().getFullYear()
): Promise<{ sheets: string[]; events: ParsedEvent[]; warnings: string[] }> {
  const sheets = readExcelFile(buffer);
  const sheetNames = sheets.map((s) => s.name);

  const ruleResult = parseEventsWithRules(sheets, fallbackYear);

  let finalEvents = ruleResult.events;
  let finalWarnings = ruleResult.warnings;

  // Use AI if rule-based parsing found very few events, or if explicitly requested
  if (useAI && ruleResult.events.length < 3) {
    const aiResult = await parseEventsWithAI(sheets, fallbackYear);
    finalEvents = aiResult.events.length > 0 ? aiResult.events : ruleResult.events;
    finalWarnings = [...finalWarnings, ...aiResult.warnings];
  }

  // Sort by date/time
  finalEvents.sort((a, b) => {
    const aDate = new Date(`${a.startDate}T${a.startTime}`).getTime();
    const bDate = new Date(`${b.startDate}T${b.startTime}`).getTime();
    return aDate - bDate;
  });

  return { sheets: sheetNames, events: finalEvents, warnings: finalWarnings };
}
