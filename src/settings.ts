export type LLMProvider = "openai" | "anthropic";

export type OpenAIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo";

export type AnthropicModel =
  | "claude-opus-4-5"
  | "claude-sonnet-4-5"
  | "claude-haiku-4-5";

export interface LiteratureReviewSettings {
  // LLM Provider settings
  provider: LLMProvider;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: OpenAIModel;
  anthropicApiKey: string;
  anthropicModel: AnthropicModel;
  temperature: number;
  maxTokens: number;

  // Output settings
  outputFolder: string;
  citationFormat: "APA" | "MLA" | "Chicago" | "Harvard";
  outputLength: "short" | "medium" | "long";
  academicTone: "formal" | "semi-formal";

  // License settings
  licenseEmail: string;
  licenseKey: string;
  isProActivated: boolean;

  // Usage tracking (free tier)
  lifetimeUsageCount: number;
}

export const DEFAULT_SETTINGS: LiteratureReviewSettings = {
  provider: "openai",
  openaiApiKey: "",
  openaiBaseUrl: "",
  openaiModel: "gpt-4o",
  anthropicApiKey: "",
  anthropicModel: "claude-sonnet-4-5",
  temperature: 0.7,
  maxTokens: 4000,

  outputFolder: "Literature Reviews",
  citationFormat: "APA",
  outputLength: "medium",
  academicTone: "formal",

  licenseEmail: "",
  licenseKey: "",
  isProActivated: false,

  lifetimeUsageCount: 0,
};

export const FREE_TIER_LIFETIME_LIMIT = 3;