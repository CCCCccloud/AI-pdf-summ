export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language = 'zh' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  // deepseek-chat has a 128K token context window.
  // At ~2 chars/token (conservative for Chinese), ~126K usable tokens after prompt/response
  // overhead ≈ 252K chars. We cap at 200K for a clean ~20% safety margin.
  const MAX_CHARS = 200_000;
  if (text.length > MAX_CHARS) {
    return res.status(413).json({
      error: `This PDF is too long to summarize — the extracted text is ${text.length.toLocaleString()} characters, which exceeds the ${MAX_CHARS.toLocaleString()}-character limit. Try a shorter document or a specific chapter/section.`,
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: language === 'zh'
              ? '你是一个有用的助手。请用中文简洁地总结所提供的文档，提炼出核心要点。'
              : 'You are a helpful assistant. Summarize the provided document text concisely in English, capturing the key points.',
          },
          {
            role: 'user',
            content: language === 'zh'
              ? `请用中文总结以下文档：\n\n${text}`
              : `Please summarize the following document:\n\n${text}`,
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('DeepSeek API error:', err);
      return res.status(502).json({ error: 'DeepSeek API request failed' });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    return res.status(500).json({ error: 'Failed to summarize text' });
  }
}
