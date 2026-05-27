import { LLMProvider, LLMMessage, LLMResponse } from "./llm-provider";

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

export class OpenAIAdapter implements LLMProvider {
  name = "OpenAI";
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number,
    baseUrl?: string
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.baseUrl = baseUrl && baseUrl.trim() !== ""
      ? baseUrl.trim().replace(/\/$/, "")
      : DEFAULT_OPENAI_BASE_URL;
  }

  async sendMessage(
    messages: LLMMessage[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      model: data.model ?? this.model,
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}