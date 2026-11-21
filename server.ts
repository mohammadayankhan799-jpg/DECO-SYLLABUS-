import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function stripXmlTags(xml: string): string {
  return xml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<a:p[^>]*>/g, '\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

async function extractTextFromOfficeZip(buffer: Buffer, ext: string): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const chunks: string[] = [];

  if (ext === 'docx') {
    const docXml = zip.file('word/document.xml');
    if (docXml) {
      chunks.push(stripXmlTags(await docXml.async('string')));
    }
    const headerFiles = Object.keys(zip.files).filter((f) => /^word\/header\d+\.xml$/.test(f));
    for (const hf of headerFiles) {
      const content = await zip.file(hf)?.async('string');
      if (content) chunks.push(stripXmlTags(content));
    }
  } else if (ext === 'pptx') {
    const slidePaths = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
        const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
        return na - nb;
      });
    for (const sp of slidePaths.slice(0, 60)) {
      const slideXml = await zip.file(sp)?.async('string');
      if (slideXml) {
        const slideNum = sp.match(/slide(\d+)\.xml/)?.[1] ?? '?';
        chunks.push(`[Slide ${slideNum}]\n${stripXmlTags(slideXml)}`);
      }
    }
  }

  return chunks.join('\n\n').slice(0, 32000);
}

async function fetchDriveMetadataSnippet(driveUrl: string): Promise<string> {
  try {
    const parsed = new URL(driveUrl);
    if (!parsed.hostname.includes('google.com')) {
      return `Provided URL: ${driveUrl}`;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const resp = await fetch(driveUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LIET-DECO-Portal/1.0)',
      },
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return `Drive URL (${driveUrl}) returned HTTP ${resp.status}.`;
    }
    const html = await resp.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Google Drive Resource';
    // Extract visible file names if public folder HTML lists them
    const fileNameMatches = Array.from(
      html.matchAll(/([A-Za-z0-9_\-\s]{3,60}\.(?:pdf|docx|pptx|xlsx|csv))/gi)
    )
      .map((m) => m[1].trim())
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 30);

    return [
      `Drive Resource Title: ${title}`,
      `Drive URL: ${driveUrl}`,
      fileNameMatches.length > 0
        ? `Detected Files in Folder Page: ${fileNameMatches.join(', ')}`
        : 'Public HTML preview did not expose individual file names directly.',
    ].join('\n');
  } catch {
    return `Drive URL provided: ${driveUrl}`;
  }
}

function handleGeminiError(err: unknown): { status: number; message: string } {
  const rawMsg = err instanceof Error ? err.message : String(err);
  if (rawMsg.includes('GEMINI_API_KEY')) {
    return { status: 503, message: rawMsg };
  }
  if (rawMsg.includes('403') || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Check GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Gemini API rate limit reached. Please retry in a few seconds.',
    };
  }
  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
    return {
      status: 503,
      message: 'Gemini model is temporarily busy due to high demand. Please retry in a few seconds.',
    };
  }
  return { status: 500, message: rawMsg || 'Unexpected server error while calling Gemini API.' };
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  maxAttempts = 3
) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempt * 900));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') });
  });

  app.post('/api/analyze-drive', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const { driveUrl, notes, files } = req.body as {
        driveUrl?: string;
        notes?: string;
        files?: Array<{ name: string; mimeType: string; contentBase64: string }>;
      };

      if (!driveUrl && (!files || files.length === 0) && !notes) {
        res.status(400).json({ error: 'Provide a Google Drive link, syllabus notes, or upload at least one file.' });
        return;
      }

      const contentParts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      const contextBlocks: string[] = [
        'Course Context: U24EC304 Digital Electronics & Computer Organization (DECO), LIET Autonomous (LR24 Regulation), B.E. III Sem CSE-AIML/CSM, Faculty: Dr. Abdul Mateen Ahmed.',
      ];

      if (driveUrl && driveUrl.trim()) {
        const snippet = await fetchDriveMetadataSnippet(driveUrl.trim());
        contextBlocks.push(snippet);
      }

      if (notes && notes.trim()) {
        contextBlocks.push(`User Pasted Syllabus / Notes:\n${notes.trim().slice(0, 20000)}`);
      }

      if (Array.isArray(files)) {
        for (const f of files.slice(0, 5)) {
          const ext = f.name.split('.').pop()?.toLowerCase() || '';
          const buffer = Buffer.from(f.contentBase64, 'base64');

          if (ext === 'pdf' || f.mimeType === 'application/pdf') {
            contextBlocks.push(`Attached PDF file: ${f.name}`);
            contentParts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: f.contentBase64,
              },
            });
          } else if (ext === 'docx' || ext === 'pptx') {
            const extracted = await extractTextFromOfficeZip(buffer, ext);
            contextBlocks.push(`Extracted text from ${f.name}:\n${extracted || '(Empty XML content)'}`);
          } else {
            const text = buffer.toString('utf-8').slice(0, 25000);
            contextBlocks.push(`File contents of ${f.name}:\n${text}`);
          }
        }
      }

      const instruction = `Analyze the provided course repository link, extracted document text, or PDF files for U24EC304 (Digital Electronics & Computer Organization).
Return structured JSON with:
1. sourceSummary: A concise 2-sentence summary of what was parsed.
2. extractedUnits: 1 to 5 syllabus units detected or refreshed from the source (each with unitNumber like "Unit I", title, topics array, and mappedCOs from CO1..CO5).
3. extractedLectures: Up to 8 lecture plan entries extracted or recommended (with lectureNumber integer 1..60, topic, unit like "Unit I", co from CO1..CO5, teachingAid filename).
4. extractedQuestions: 2 to 4 exam-grade practice questions calibrated to LIET U24EC304 with unit ("Unit I".."Unit V"), co ("CO1".."CO5"), btl ("BTL1".."BTL5"), source, marks (2, 4, or 5), question, 4 options, correctOptionIndex (0..3), solutionSteps array, and finalAnswer.`;

      contentParts.unshift({ text: `${instruction}\n\n--- INPUT DATA ---\n${contextBlocks.join('\n\n')}` });

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: { parts: contentParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sourceSummary: { type: Type.STRING },
              extractedUnits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    unitNumber: { type: Type.STRING },
                    title: { type: Type.STRING },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mappedCOs: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['unitNumber', 'title', 'topics', 'mappedCOs'],
                },
              },
              extractedLectures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lectureNumber: { type: Type.INTEGER },
                    topic: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    co: { type: Type.STRING },
                    teachingAid: { type: Type.STRING },
                  },
                  required: ['lectureNumber', 'topic', 'unit', 'co', 'teachingAid'],
                },
              },
              extractedQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    unit: { type: Type.STRING },
                    co: { type: Type.STRING },
                    btl: { type: Type.STRING },
                    source: { type: Type.STRING },
                    marks: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctOptionIndex: { type: Type.INTEGER },
                    solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    finalAnswer: { type: Type.STRING },
                  },
                  required: [
                    'unit',
                    'co',
                    'btl',
                    'source',
                    'marks',
                    'question',
                    'options',
                    'correctOptionIndex',
                    'solutionSteps',
                    'finalAnswer',
                  ],
                },
              },
            },
            required: ['sourceSummary', 'extractedUnits', 'extractedLectures', 'extractedQuestions'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const { status, message } = handleGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/generate-question', async (req, res) => {
    try {
      const ai = getGeminiClient();
      const { unit = 'Unit I', co = 'CO1', btl = 'BTL3', topicHint = '' } = req.body as {
        unit?: string;
        co?: string;
        btl?: string;
        topicHint?: string;
      };

      const prompt = `Generate one rigorous university exam question for LIET Autonomous (U24EC304: Digital Electronics & Computer Organization).
Target constraints:
- Unit: ${unit}
- Course Outcome: ${co}
- Bloom's Taxonomy Level: ${btl}
${topicHint ? `- Topic focus: ${topicHint}` : ''}

Unit topic guidelines:
- Unit I: Number systems, IEEE 754, 2's complement, Hamming (7,4), Von Neumann & performance metrics
- Unit II: K-Maps, Quine-McCluskey, Adders, MUX/Decoders/Encoders, Flip-Flops, Shift Registers, Counters
- Unit III: Booth's multiplication, Restoring/Non-Restoring division, Addressing modes EA, RTL, Microprogrammed control
- Unit IV: I/O modes, Strobe/Handshaking, DMA, Cache mapping & T_avg, Virtual memory
- Unit V: RISC vs CISC, 5-stage pipelining, RAW/WAR/WAW hazards, Control hazards, Superscalar

Provide 4 distinct options, exact correctOptionIndex (0-3), detailed step-by-step mathematical or logical solutionSteps, and a concise finalAnswer.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              unit: { type: Type.STRING },
              co: { type: Type.STRING },
              btl: { type: Type.STRING },
              source: { type: Type.STRING },
              marks: { type: Type.INTEGER },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER },
              solutionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              finalAnswer: { type: Type.STRING },
            },
            required: [
              'unit',
              'co',
              'btl',
              'source',
              'marks',
              'question',
              'options',
              'correctOptionIndex',
              'solutionSteps',
              'finalAnswer',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        ...parsed,
        id: `ai-q-${Date.now()}`,
        isAiGenerated: true,
      });
    } catch (err) {
      const { status, message } = handleGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DECO Course Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
