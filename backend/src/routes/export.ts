import { Router, Request, Response } from 'express';
import { sessions } from '../store';
import { generateICS } from '../services/calendarExport';

const router = Router();

router.post('/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const events = req.body.events || session.events;
  const calendarName = req.body.calendarName || session.fileName.replace(/\.[^.]+$/, '');
  const timezone = req.body.timezone || 'Europe/London';

  try {
    const ics = generateICS(events, calendarName);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${calendarName}.ics"`);
    return res.send(ics);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Failed to generate calendar file' });
  }
});

export default router;
