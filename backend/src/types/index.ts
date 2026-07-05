export interface ParsedEvent {
  id: string;
  title: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;
  startTime: string; // HH:mm
  endTime: string;
  location?: string;
  description?: string;
  timezone?: string;
  color?: string;
  recurrence?: string;
  confidence: number;
  warnings: string[];
  raw?: Record<string, unknown>;
}

export interface UploadResult {
  sessionId: string;
  fileName: string;
  sheets: string[];
  events: ParsedEvent[];
  warnings: string[];
}

export interface ExportPayload {
  events: ParsedEvent[];
  calendarName?: string;
  timezone?: string;
}
