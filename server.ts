import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  checkAndInitCloudflare,
} from './server/cloudflareService';
import {
  initBackendStorage,
  getAllKhatmahs,
  getKhatmahById,
  createNewKhatmah,
  reserveKhatmahPart,
  unreserveKhatmahPart,
  completeKhatmahPart,
  uncompleteKhatmahPart,
  clearAllBackendKhatmahs,
} from './server/khatmahBackend';

import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize storage on startup
  initBackendStorage().catch(err => {
    console.error('Initial storage init error:', err);
  });

  // ==========================================
  // API Routes (must be declared BEFORE Vite)
  // ==========================================

  // Middleware to disable HTTP caching on all API responses
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { word, customPrompt, dataString } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const fullContent = `
الكلمة المراد تحليلها: "${word}"

تعليمات التحليل:
${customPrompt}

البيانات الإحصائية المستخرجة من القرآن (المثاني):
${dataString}
      `;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const response = await ai.models.generateContentStream({
          model: 'gemini-3.1-pro-preview',
          contents: fullContent,
      });

      for await (const chunk of response) {
          if (chunk.text) {
              res.write(chunk.text);
          }
      }
      res.end();
    } catch (err: any) {
      console.error("AI Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.' });
      } else {
        res.write('\n\n[Error occurred during streaming]');
        res.end();
      }
    }
  });

  // 1. Health & Status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Cloudflare Connection & Auto-Diagnostic Status
  app.get('/api/cloudflare/status', async (req, res) => {
    try {
      const status = await checkAndInitCloudflare(true);
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear all khatmahs endpoint
  app.post('/api/khatmah/admin/clear-all', async (req, res) => {
    try {
      await clearAllBackendKhatmahs();
      res.json({ success: true, message: 'All khatmahs deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Khatmah CRUD & Interactions (supporting both /api/khatmah and /api/khatmahs)
  const getKhatmahsHandler = async (req: express.Request, res: express.Response) => {
    try {
      const list = await getAllKhatmahs();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.get('/api/khatmah', getKhatmahsHandler);
  app.get('/api/khatmahs', getKhatmahsHandler);

  const createKhatmahHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { title, dedication, targetDate, createdBy, khatmahType } = req.body;
      const created = await createNewKhatmah({
        title,
        dedication,
        targetDate,
        createdBy,
        khatmahType,
      });
      res.json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/khatmah', createKhatmahHandler);
  app.post('/api/khatmahs', createKhatmahHandler);

  app.get('/api/khatmah/:id', async (req, res) => {
    try {
      const item = await getKhatmahById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'الختمة غير موجودة' });
      }
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khatmah/:id/reserve', async (req, res) => {
    try {
      const { partNumber, reservedBy } = req.body;
      if (!partNumber || partNumber < 1 || partNumber > 30) {
        return res.status(400).json({ error: 'رقم الجزء غير صالح' });
      }
      const updated = await reserveKhatmahPart(
        req.params.id,
        Number(partNumber),
        reservedBy || 'فاعل خير'
      );
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khatmah/:id/unreserve', async (req, res) => {
    try {
      const { partNumber } = req.body;
      if (!partNumber || partNumber < 1 || partNumber > 30) {
        return res.status(400).json({ error: 'رقم الجزء غير صالح' });
      }
      const updated = await unreserveKhatmahPart(
        req.params.id,
        Number(partNumber)
      );
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khatmah/:id/complete', async (req, res) => {
    try {
      const { partNumber, completedBy } = req.body;
      if (!partNumber || partNumber < 1 || partNumber > 30) {
        return res.status(400).json({ error: 'رقم الجزء غير صالح' });
      }
      const updated = await completeKhatmahPart(
        req.params.id,
        Number(partNumber),
        completedBy
      );
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/khatmah/:id/uncomplete', async (req, res) => {
    try {
      const { partNumber } = req.body;
      if (!partNumber || partNumber < 1 || partNumber > 30) {
        return res.status(400).json({ error: 'رقم الجزء غير صالح' });
      }
      const updated = await uncompleteKhatmahPart(
        req.params.id,
        Number(partNumber)
      );
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Vite Middleware & SPA Static Files
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Quran Server running on port ${PORT} (0.0.0.0)`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
