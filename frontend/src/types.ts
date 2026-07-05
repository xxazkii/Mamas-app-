export interface ParsedEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  timezone?: string;
  color?: string;
  recurrence?: string;
  confidence: number;
  warnings: string[];
}

export interface UploadResult {
  sessionId: string;
  fileName: string;
  sheets: string[];
  events: ParsedEvent[];
  warnings: string[];
}
