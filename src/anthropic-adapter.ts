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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Anthropic API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model: data.model,
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      });
      return response.ok || response.status === 400;
    } catch {
      return false;
    }
  }
}