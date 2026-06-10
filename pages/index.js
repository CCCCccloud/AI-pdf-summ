import { useState } from 'react';

export default function Home() {
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState(''); // 'extracting' | 'summarizing' | ''
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('zh'); // 'zh' | 'en'

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setFileName(file.name);
    setSummary('');
    setError('');

    // Step 1: extract text from PDF
    setStatus('extracting');
    let text;
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');
      text = data.text;
    } catch (err) {
      setError(err.message);
      setStatus('');
      return;
    }

    // Step 2: summarize with DeepSeek
    setStatus('summarizing');
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed');
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  const statusLabel = status === 'extracting' ? 'Extracting text…' : status === 'summarizing' ? 'Summarizing…' : '';

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
        .output-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .output-header h2 { font-size: 1rem; font-weight: 600; color: #374151; }
        .copy-btn {
          font-size: 0.8rem; padding: 4px 12px; border-radius: 6px; border: 1px solid #d1d5db;
          background: #f9fafb; color: #374151; cursor: pointer; transition: background 0.15s;
        }
        .copy-btn:hover { background: #f3f4f6; }
        .copy-btn.copied { background: #dcfce7; border-color: #86efac; color: #166534; }

        .lang-toggle { display: flex; gap: 6px; margin-bottom: 20px; }
        .lang-btn {
          padding: 6px 16px; border-radius: 20px; border: 1px solid #d1d5db;
          background: #f9fafb; color: #6b7280; cursor: pointer; font-size: 0.875rem;
          transition: all 0.15s;
        }
        .lang-btn:hover { background: #eef2ff; border-color: #6366f1; color: #4f46e5; }
        .lang-btn.active { background: #6366f1; border-color: #6366f1; color: #fff; font-weight: 600; }

        .output-box p {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.925rem;
          color: #1f2937;
          line-height: 1.7;
        }
      `}</style>

      <div className="container">
        <h1>PDF Summarizer</h1>

        <div className="lang-toggle">
          <button
            className={`lang-btn${language === 'zh' ? ' active' : ''}`}
            onClick={() => setLanguage('zh')}
            disabled={!!status}
          >
            中文
          </button>
          <button
            className={`lang-btn${language === 'en' ? ' active' : ''}`}
            onClick={() => setLanguage('en')}
            disabled={!!status}
          >
            English
          </button>
        </div>

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
              disabled={!!status}
            />
          </label>
          {fileName && <p className="file-name">Selected: {fileName}</p>}
        </div>

        {statusLabel && <p className="status">{statusLabel}</p>}
        {error && <p className="error">Error: {error}</p>}

        {summary && (
          <div className="output-box">
            <div className="output-header">
              <h2>Summary</h2>
              <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p>{summary}</p>
          </div>
        )}
      </div>
    </>
  );
}
