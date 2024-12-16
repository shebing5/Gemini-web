import { GeminiRequest, ApiResponse } from '../../types/api';
import { useApiKeyStore } from '../../store/apiKeyStore';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function callGeminiApi(
  messages: { role: string; content: string }[],
  model: string
): Promise<ApiResponse> {
  const apiKey = useApiKeyStore.getState().geminiKey;
  
  if (!apiKey) {
    return {
      content: '',
      error: 'Gemini API key not found. Please set your API key in the settings.'
    };
  }

  try {
    // Build context from previous messages
    const context = messages
      .slice(0, -1) // Exclude the last message
      .map(m => m.content)
      .join('\n\n');

    const lastMessage = messages[messages.length - 1];
    const prompt = context
      ? `Context:\n${context}\n\nCurrent message:\n${lastMessage.content}`
      : lastMessage.content;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await fetch(
      `${API_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    return {
      content: data.candidates[0].content.parts[0].text
    };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
