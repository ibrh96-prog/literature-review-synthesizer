import { requestUrl } from "obsidian";
import { LLMProvider, LLMMessage, LLMResponse } from "./llm-provider";

export class AnthropicAdapter implements LLMProvider {
  name = "Anthropic";
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async sendMessage(
    messages: LLMMessage[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await requestUrl({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: anthropicMessages,
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
      throw new Error(`Anthropic API error: ${message}`);
    }

    const data = response.json;

    return {
      content: data.content[0].text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model: data.model,
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await requestUrl({
        url: "https://api.anthropic.com/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
        throw: false,
      });
      return response.status < 400 || response.status === 400;
    } catch {
      return false;
    }
  }
}
