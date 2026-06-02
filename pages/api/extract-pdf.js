import formidable from 'formidable';
import fs from 'fs';

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
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const result = await pdfParse(buffer);
    return res.status(200).json({ text: result.text });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: 'Failed to extract text from PDF' });
  }
}
