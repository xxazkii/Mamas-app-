import express, { Request, Response } from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload';
import eventsRoutes from './routes/events';
import exportRoutes from './routes/export';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Excel Calendar Importer API running on http://localhost:${PORT}`);
});
