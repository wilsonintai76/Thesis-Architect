import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', firebaseProject: firebaseConfig.projectId });
  });

  // API endpoint for raw web content extraction (Bypasses CORS for frontend)
  app.post('/api/extract', async (req, res) => {
    try {
      const { url } = req.body;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      const title = $('title').text() || $('h1').first().text() || 'Untitled Source';
      
      // Clean content
      $('script, style, nav, footer, header, iframe, noscript').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); 

      res.json({ 
        title, 
        url,
        content,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Extraction API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch external content' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
