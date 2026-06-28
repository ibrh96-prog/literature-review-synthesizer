import { requestUrl } from "obsidian";
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

    const response = await requestUrl({
      url: `${this.baseUrl}/chat/completions`,
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
      throw: false,
    });

    if (response.status >= 400) {
      let message = `HTTP ${response.status}`;
      try {
        const error = response.json;
        message = error?.error?.message || message;
      } catch {
        message = response.text?.slice(0, 200) || message;
      }
      throw new Error(`API error: ${message}`);
    }

    const data = response.json;
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
      const response = await requestUrl({
        url: `${this.baseUrl}/models`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        throw: false,
      });
      return response.status < 400;
    } catch {
      return false;
    }
  }
}
