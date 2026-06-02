import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setText('');
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      setText(data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { min-height: 100vh; background: #f3f4f6; font-family: sans-serif; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 24px; color: #111; }

        .upload-box {
          border: 2px dashed #6366f1;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          background: #fff;
          cursor: pointer;
          transition: background 0.2s;
        }
        .upload-box:hover { background: #eef2ff; }
        .upload-box input { display: none; }
        .upload-box label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .upload-icon { font-size: 2.5rem; }
        .upload-text { font-size: 1rem; color: #4b5563; }
        .upload-hint { font-size: 0.8rem; color: #9ca3af; }
        .file-name { margin-top: 12px; font-size: 0.9rem; color: #6366f1; font-weight: 500; }

        .status { margin-top: 20px; color: #6366f1; font-style: italic; }
        .error { margin-top: 20px; color: #dc2626; }

        .output-box {
          margin-top: 32px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
        }
        .output-box h2 { font-size: 1rem; font-weight: 600; color: #374151; margin-bottom: 12px; }
        .output-box pre {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.875rem;
          color: #1f2937;
          line-height: 1.6;
          max-height: 60vh;
          overflow-y: auto;
        }
      `}</style>

      <div className="container">
        <h1>PDF Text Extractor</h1>

        <div className="upload-box">
          <label htmlFor="pdf-input">
            <span className="upload-icon">📄</span>
            <span className="upload-text">Click to select a PDF file</span>
            <span className="upload-hint">Only .pdf files are supported</span>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />
          </label>
          {fileName && <p className="file-name">Selected: {fileName}</p>}
        </div>

        {loading && <p className="status">Extracting text...</p>}
        {error && <p className="error">Error: {error}</p>}

        {text && (
          <div className="output-box">
            <h2>Extracted Text</h2>
            <pre>{text}</pre>
          </div>
        )}
      </div>
    </>
  );
}
