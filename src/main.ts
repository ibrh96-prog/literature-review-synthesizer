import { Plugin, Notice } from "obsidian";
import {
  LiteratureReviewSettings,
  DEFAULT_SETTINGS,
} from "./settings";
import { SettingsTab } from "./settings-tab";
import { OpenAIAdapter } from "./openai-adapter";
import { AnthropicAdapter } from "./anthropic-adapter";
import { LLMProvider } from "./llm-provider";
import { NoteCollector } from "./note-collector";
import { SynthesisModal } from "./synthesis-modal";

export default class LiteratureReviewSynthesizer extends Plugin {
  settings: LiteratureReviewSettings;
  llmProvider: LLMProvider | null = null;
  noteCollector: NoteCollector;
  isSynthesisInProgress: boolean = false;

  async onload() {
    await this.loadSettings();

    this.noteCollector = new NoteCollector(this.app);
    this.initializeLLMProvider();

    this.addSettingTab(new SettingsTab(this.app, this));

    this.addCommand({
      id: "open-synthesizer",
      name: "Open Literature Review Synthesizer",
      callback: () => {
        if (!this.llmProvider) {
          new Notice(
            "⚠️ Please configure your API key in Settings before running a synthesis."
          );
          return;
        }
        if (this.isSynthesisInProgress) {
          new Notice("⚠️ A synthesis is already running.");
          return;
        }
        new SynthesisModal(this.app, this).open();
      },
    });

    this.addRibbonIcon("book-open", "Literature Review Synthesizer", () => {
      if (!this.llmProvider) {
        new Notice(
          "⚠️ Please configure your API key in Settings before running a synthesis."
        );
        return;
      }
      if (this.isSynthesisInProgress) {
        new Notice("⚠️ A synthesis is already running.");
        return;
      }
      new SynthesisModal(this.app, this).open();
    });

    console.log("Literature Review Synthesizer loaded.");
    new Notice("Literature Review Synthesizer is active.");
  }

  async onunload() {
    console.log("Literature Review Synthesizer unloaded.");
  }

  initializeLLMProvider() {
    const s = this.settings;

    if (s.provider === "openai" && s.openaiApiKey) {
      this.llmProvider = new OpenAIAdapter(
        s.openaiApiKey,
        s.openaiModel,
        s.temperature,
        s.maxTokens,
        s.openaiBaseUrl
      );
    } else if (s.provider === "anthropic" && s.anthropicApiKey) {
      this.llmProvider = new AnthropicAdapter(
        s.anthropicApiKey,
        s.anthropicModel,
        s.temperature,
        s.maxTokens
      );
    } else {
      this.llmProvider = null;
    }
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.initializeLLMProvider();
  }
}