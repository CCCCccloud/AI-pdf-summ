import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { PDFParse } from 'pdf-parse';

export const config = {
  api: { bodyParser: false },
};

// pdf-parse ships its own compiled pdfjs worker; must be set explicitly.
// path.resolve uses process.cwd() which is /var/task on Vercel, where
// node_modules for direct dependencies are guaranteed to exist.
PDFParse.setWorker(
  pathToFileURL(
    path.resolve('node_modules/pdf-parse/dist/worker/pdf.worker.mjs')
  ).href
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ uploadDir: os.tmpdir(), keepExtensions: true });
  let files;
  try {
    [, files] = await form.parse(req);
  } catch {
    return res.status(400).json({ error: 'Failed to parse upload' });
  }

  const file = files.pdf?.[0];
  if (!file) {
    return res.status(400).json({ error: 'No PDF file found in request' });
  }

  try {
    const buffer = fs.readFileSync(file.filepath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return res.status(200).json({ text: result.text.trim() });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
}
