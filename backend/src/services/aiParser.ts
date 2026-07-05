import OpenAI from 'openai';
import { z } from 'zod';
import type { ParsedEvent } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const eventSchema = z.object({
  title: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().optional(),
  description: z.string().optional(),
  timezone: z.string().optional(),
  color: z.string().optional(),
  recurrence: z.string().optional(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
});

const responseSchema = z.object({
  events: z.array(eventSchema),
  warnings: z.array(z.string()).default([]),
});

export async function parseEventsWithAI(
  sheets: { name: string; rows: unknown[][] }[],
  fallbackYear: number = new Date().getFullYear()
): Promise<{ events: ParsedEvent[]; warnings: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    return { events: [], warnings: ['OpenAI API key not configured. Add OPENAI_API_KEY to your environment.'] };
  }

  // Build a compact structured summary for the AI
  const summary = sheets.map((sheet) => {
    const headerIndex = Math.min(sheet.rows.length - 1, 10);
    const sampleRows = sheet.rows.slice(0, Math.min(sheet.rows.length, 25));
    return {
      sheet: sheet.name,
      rows: sampleRows.map((row) => row.map((cell) => String(cell ?? '').trim())),
    };
  });

  const prompt = `You are an expert timetable parser. Extract calendar events from these spreadsheet sheets.
Rules:
- Use date format YYYY-MM-DD and time format HH:mm (24-hour).
- If the year is missing, assume ${fallbackYear}.
- Convert all dates/times to the user's timezone if inferable, otherwise use "Europe/London".
- For weekly grids (e.g., Time | Monday | Tuesday), expand each cell into a separate event.
- Preserve location, description, and recurring patterns.
- Assign a confidence score (0.0-1.0) based on how certain you are.
- Add warnings for ambiguous or missing data.

Return ONLY valid JSON matching this schema:
{
  "events": [
    {
      "title": string,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "location?": string,
      "description?": string,
      "timezone?": string,
      "color?": string,
      "recurrence?": string,
      "confidence": number,
      "warnings": string[]
    }
  ],
  "warnings": string[]
}

Sheets:
${JSON.stringify(summary, null, 2)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You extract structured calendar events from spreadsheet data. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4000,
  });

  const raw = completion.choices[0].message.content || '{}';
  const parsed = JSON.parse(raw);
  const validated = responseSchema.parse(parsed);

  const events = validated.events.map((event: z.infer<typeof eventSchema>, index: number) => ({
    ...event,
    id: `${event.startDate}-${event.startTime}-${index}`,
    confidence: Math.round(event.confidence * 100),
  }));

  return { events, warnings: validated.warnings };
}
