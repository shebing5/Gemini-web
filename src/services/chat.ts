/* eslint-disable @typescript-eslint/no-unused-vars */
import { callGeminiApi } from './api/gemini';
import { callXAIApi } from './api/xai';
import type { ModelProvider } from '../types/api';

export async function generateContent(
  messages: { role: string; content: string }[],
  model: string
): Promise<string> {
  const provider: ModelProvider = model.startsWith('gemini') ? 'GEMINI' : 'X_AI';
  
  const apiCall = provider === 'GEMINI' ? callGeminiApi : callXAIApi;
  const response = await apiCall(messages, model);
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.content;
}

export async function generateTitle(messages: { role: string; content: string }[]): Promise<string> {
  const context = messages
    .slice(0, 3)
    .map(m => m.content)
    .join('\n');
  
  const prompt = `Based on this conversation, generate a short, descriptive title (max 6 words):\n${context}`;
  
  try {
    const title = await generateContent(
      [{ role: 'user', content: prompt }],
      'gemini-1.5-flash-latest'
    );
    return title.replace(/["']/g, '').trim();
  } catch (error) {
    throw new Error('Failed to generate title');
  }
}
