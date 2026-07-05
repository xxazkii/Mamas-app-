import { Router, Request, Response } from 'express';
import { sessions } from '../store';
import type { ParsedEvent } from '../types';

const router = Router();

router.get('/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  return res.json(session);
});

router.put('/:sessionId', (req: Request, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const events = req.body.events as ParsedEvent[];
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'events array is required' });
  }

  session.events = events;
  sessions.set(req.params.sessionId, session);
  return res.json(session);
});

export default router;
