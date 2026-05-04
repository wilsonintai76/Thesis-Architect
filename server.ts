import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
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

  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    return new GoogleGenAI({ apiKey });
  };

  // API endpoint for deep web research
  app.post('/api/research', async (req, res) => {
    try {
      const genAI = getGenAI();
      const { prompt, focus } = req.body;
      
      const fullPrompt = `You are a professional research assistant. 
      Perform a deep search on the following topic: "${prompt}".
      Focus specifically on: ${focus || 'academic relevance and current data'}.
      
      Provide a structured report with:
      1. Executive Summary
      2. Key Findings (supported by search data)
      3. Relevant Statistics/Data Points
      4. Proposed Academic Citations
      
      Maintain a highly scholarly and objective tone.`;

      const result = await genAI.models.generateContent({ 
        model: "gemini-1.5-flash",
        contents: fullPrompt,
        // @ts-ignore
        tools: [
          {
            googleSearchRetrieval: {}
          }
        ]
      });
      const text = result.text || '';

      res.json({ content: text });
    } catch (error: any) {
      console.error('Research API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint for automatic source extraction from URL
  app.post('/api/extract', async (req, res) => {
    try {
      const genAI = getGenAI();
      const { url } = req.body;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Basic extraction
      const title = $('title').text() || $('h1').first().text();
      
      // Get main content (approximated)
      $('script, style, nav, footer, header').remove();
      const content = $('body').text().substring(0, 10000); // Send first 10k chars to AI

      const extractPrompt = `Analyze the following webpage content from ${url}.
      
      1. Summarize the main scholarly/informative contribution (3-5 sentences).
      2. Extract 3 key data points or arguments.
      3. Provide a full academic citation in APA format.
      4. Suggest 3 relevant keywords.
      
      CONTENT:
      ${content}`;

      const result = await genAI.models.generateContent({ 
        model: "gemini-1.5-flash",
        contents: extractPrompt
      });
      const analysis = result.text || '';

      res.json({ 
        title, 
        url,
        analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Extraction API Error:', error);
      res.status(500).json({ error: error.message });
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
