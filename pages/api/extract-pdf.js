import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});
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

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // pdfjs-dist sets workerSrc to the relative path './pdf.worker.mjs' at
    // init time, which breaks in Vercel's webpack bundle where the worker file
    // isn't co-located with the bundle. Override with the absolute file URL so
    // Node.js worker_threads can always locate it regardless of bundle layout.
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
      path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
    ).href;

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdfDoc = await loadingTask.promise;

    let text = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      text += content.items
        .filter((item) => 'str' in item)
        .map((item) => item.str)
        .join(' ') + '\n\n';
      page.cleanup();
    }

    await pdfDoc.destroy();
    return res.status(200).json({ text: text.trim() });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
}
