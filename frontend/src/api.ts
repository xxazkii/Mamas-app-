import { UploadResult, ParsedEvent } from './types';

const API_BASE = 'http://localhost:4000/api';

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

export async function updateEvents(sessionId: string, events: ParsedEvent[]): Promise<UploadResult> {
  const res = await fetch(`${API_BASE}/events/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Update failed');
  }

  return res.json();
}

export async function exportICS(sessionId: string, events: ParsedEvent[], calendarName?: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, calendarName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Export failed');
  }

  return res.blob();
}
