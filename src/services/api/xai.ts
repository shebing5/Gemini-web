import { XAIRequest, ApiResponse, ApiMessage } from '../../types/api';
import { useApiKeyStore } from '../../store/apiKeyStore';

const API_URL = 'https://api.x.ai/v1/chat/completions';

export async function callXAIApi(
  messages: { role: string; content: string }[],
  model: string
): Promise<ApiResponse> {
  const apiKey = useApiKeyStore.getState().xaiKey;
  
  if (!apiKey) {
    return {
      content: '',
      error: 'XAI API key not found. Please set your API key in the settings.'
    };
  }

  try {
    const apiMessages: ApiMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      ...messages.map(m => ({
        role: m.role as ApiMessage['role'],
        content: m.content
      }))
    ];

    const request: XAIRequest = {
      messages: apiMessages,
      model,
      stream: false,
      temperature: 0.7
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    return {
      content: data.choices[0].message.content
    };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
