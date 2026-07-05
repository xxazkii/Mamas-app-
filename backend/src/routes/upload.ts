import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { writeFileSync } from 'fs';
import { parseExcelFile } from '../services/parser';
import { readExcelFile } from '../services/excelParser';
import { sessions } from '../store';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = req.file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls'].includes(ext)) {
      return res.status(400).json({ error: 'Only .xlsx and .xls files are supported' });
    }

    const sessionId = uuid();
    const rawSheets = readExcelFile(req.file.buffer);
    const { sheets, events, warnings } = await parseExcelFile(req.file.buffer);

    const debugPath = '/Users/ahmedkhan/CascadeProjects/excel-calendar-importer/backend/debug-last-upload.json';
    writeFileSync(
      debugPath,
      JSON.stringify({ fileName: req.file.originalname, rawSheets, eventCount: events.length, events, warnings }, null, 2)
    );

    sessions.set(sessionId, {
      sessionId,
      fileName: req.file.originalname,
      sheets,
      events,
      warnings,
    });

    return res.json({
      sessionId,
      fileName: req.file.originalname,
      sheets,
      events,
      warnings,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to parse spreadsheet' });
  }
});

export default router;
