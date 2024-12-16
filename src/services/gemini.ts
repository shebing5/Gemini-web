const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function generateContent(
  prompt: string,
  model: string = 'gemini-1.5-flash-latest'
) {
  try {
    const response = await fetch(
      `${API_URL}/${model}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
}

export async function generateTitle(messages: { role: string; content: string }[]) {
  const context = messages
    .slice(0, 3)
    .map(m => m.content)
    .join('\n');
  
  const prompt = `Based on this conversation, generate a short, descriptive title (max 6 words):\n${context}`;
  
  try {
    const title = await generateContent(prompt);
    return title.replace(/["']/g, '').trim();
  } catch {
    return 'New Chat';
  }
}
