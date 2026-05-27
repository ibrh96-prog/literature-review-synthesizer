export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface LLMProvider {
  name: string;
  sendMessage(messages: LLMMessage[], systemPrompt: string): Promise<LLMResponse>;
  validateApiKey(): Promise<boolean>;
}