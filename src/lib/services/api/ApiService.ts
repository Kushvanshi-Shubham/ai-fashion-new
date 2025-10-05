// API Service based on proven old system
import type { ModelType } from '../../../types/extraction/ExtractionTypes';

// OpenAI API types
interface OpenAIMessage {
  role: 'user' | 'system' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
  }>;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens: number;
  temperature: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
}

export interface APIResponse {
  content: string;
  tokensUsed: number;
  modelUsed: ModelType;
}

export class ApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
  }

  async callVisionAPI(prompt: string, base64Image: string): Promise<APIResponse> {
    const requestPayload: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    };

    // Debug: Log request payload size
    console.log('OpenAI API Request Debug:', {
      model: requestPayload.model,
      promptLength: prompt.length,
      imageUrlLength: base64Image.length,
      maxTokens: requestPayload.max_tokens,
      apiKeyConfigured: !!this.apiKey && this.apiKey.length > 20
    });

    // Validate image size (OpenAI has a 20MB limit)
    if (base64Image.length > 20 * 1024 * 1024) {
      throw new Error('Image too large for OpenAI API (>20MB)');
    }

    const response = await this.retryRequest(async () => {
      return await this.makeRequest<OpenAIResponse>('/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });
    }, 3, 2000);

    if (!response.success) {
      throw new Error(`Vision API call failed: ${response.error}`);
    }

    const apiData = response.data!;
    const choice = apiData.choices[0];

    if (!choice?.message?.content) {
      throw new Error('Invalid response from Vision API');
    }

    return {
      content: choice.message.content,
      tokensUsed: apiData.usage.total_tokens,
      modelUsed: 'gpt-4o'
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<{ success: boolean; data?: T; error?: string }>,
    maxRetries: number,
    delay: number
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    let lastError = '';
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await requestFn();
        if (result.success) {
          return result;
        }
        lastError = result.error || 'Unknown error';
        
        // Don't retry on client errors (400-499)
        if (lastError.includes('HTTP 4')) {
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    return { success: false, error: lastError };
  }
}