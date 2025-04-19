import OpenAI from 'openai';

let openai: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string) => {
  openai = new OpenAI({
    apiKey: apiKey,
  });
  return openai;
};

export const summarizeText = async (
  text: string,
  apiKey: string,
  options = {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
  }
) => {
  if (!openai) {
    initializeOpenAI(apiKey);
  }

  if (!openai) {
    throw new Error('OpenAI API not initialized');
  }

  try {
    const response = await openai.chat.completions.create({
      model: options.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text while preserving the original structure and key information.',
        },
        {
          role: 'user',
          content: `Please summarize the following text, preserving the original structure, headings, and key information. Keep any important details, but make the content more concise:\n\n${text}`,
        },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw error;
  }
};

export const extractSections = async (
  text: string,
  apiKey: string,
  options = {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000,
  }
) => {
  if (!openai) {
    initializeOpenAI(apiKey);
  }

  if (!openai) {
    throw new Error('OpenAI API not initialized');
  }

  try {
    const response = await openai.chat.completions.create({
      model: options.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that identifies and extracts sections from text.',
        },
        {
          role: 'user',
          content: `Please identify and extract the sections from the following text. Return a JSON array where each object has a title, content, and approximate page number:\n\n${text}`,
        },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    
    const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || content.match(/\[([\s\S]*)\]/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON from response:', content);
      throw new Error('Failed to parse sections from OpenAI response');
    }
  } catch (error) {
    console.error('Error extracting sections:', error);
    throw error;
  }
};
