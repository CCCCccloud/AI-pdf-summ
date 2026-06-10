export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language = 'zh' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
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
            // Limit to 50 000 chars to stay well within context limits
            content: language === 'zh'
              ? `请用中文总结以下文档：\n\n${text.slice(0, 50000)}`
              : `Please summarize the following document:\n\n${text.slice(0, 50000)}`,
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
