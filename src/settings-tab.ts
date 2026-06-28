import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import LiteratureReviewSynthesizer from "./main";
import { FREE_TIER_MONTHLY_LIMIT, OpenAIModel, AnthropicModel } from "./settings";
import { validateLicense, GUMROAD_URL } from "./license-validator";

export class SettingsTab extends PluginSettingTab {
  plugin: LiteratureReviewSynthesizer;

  constructor(app: App, plugin: LiteratureReviewSynthesizer) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("General").setHeading();

    new Setting(containerEl).setName("LLM Provider").setHeading();

    new Setting(containerEl)
      .setName("Provider")
      .setDesc("Choose your AI provider.")
      .addDropdown((drop) =>
        drop
          .addOption("openai", "OpenAI (& compatible)")
          .addOption("anthropic", "Anthropic")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value: "openai" | "anthropic") => {
            this.plugin.settings.provider = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.provider === "openai") {
      new Setting(containerEl)
        .setName("API Key")
        .setDesc("Your API key. Stored locally, never transmitted to anyone except your chosen provider.")
        .addText((text) =>
          text
            .setPlaceholder("sk-...")
            .setValue(this.plugin.settings.openaiApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openaiApiKey = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Custom Base URL (optional)")
        .setDesc(
          "Leave blank to use OpenAI. Enter a custom URL to use OpenAI-compatible providers " +
          "such as OpenRouter (https://openrouter.ai/api/v1) or a local Ollama instance."
        )
        .addText((text) =>
          text
            .setPlaceholder("https://openrouter.ai/api/v1")
            .setValue(this.plugin.settings.openaiBaseUrl)
            .onChange(async (value) => {
              this.plugin.settings.openaiBaseUrl = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Model")
        .setDesc(
          "Select a preset model, or type the model ID from your provider " +
          "(e.g. meta-llama/llama-3.1-8b-instruct for OpenRouter free tier)."
        )
        .addText((text) =>
          text
            .setPlaceholder("e.g. meta-llama/llama-3.1-8b-instruct")
            .setValue(this.plugin.settings.openaiModel)
            .onChange(async (value: string) => {
              this.plugin.settings.openaiModel = value.trim() as OpenAIModel;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.provider === "anthropic") {
      new Setting(containerEl)
        .setName("Anthropic API Key")
        .setDesc("Your Anthropic API key. Stored locally, never transmitted.")
        .addText((text) =>
          text
            .setPlaceholder("sk-ant-...")
            .setValue(this.plugin.settings.anthropicApiKey)
            .onChange(async (value) => {
              this.plugin.settings.anthropicApiKey = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("Anthropic Model")
        .setDesc("Select the model to use.")
        .addDropdown((drop) =>
          drop
            .addOption("claude-opus-4-5", "Claude Opus")
            .addOption("claude-sonnet-4-5", "Claude Sonnet")
            .addOption("claude-haiku-4-5", "Claude Haiku")
            .setValue(this.plugin.settings.anthropicModel)
            .onChange(async (value: AnthropicModel) => {
              this.plugin.settings.anthropicModel = value;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName("Validate API Key")
      .setDesc("Test your API key and connection.")
      .addButton((btn) =>
        btn.setButtonText("Test Connection").onClick(async () => {
          if (!this.plugin.llmProvider) {
            new Notice("Please enter an API key first.");
            return;
          }
          btn.setButtonText("Testing...").setDisabled(true);
          const valid = await this.plugin.llmProvider.validateApiKey();
          btn.setButtonText("Test Connection").setDisabled(false);
          if (valid) {
            new Notice("✅ Connection successful!");
          } else {
            new Notice("❌ Connection failed. Please check your key and URL.");
          }
        })
      );

    new Setting(containerEl).setName("Generation").setHeading();

    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("Controls creativity. Lower = more focused, higher = more creative. (0.0 – 1.0)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.1)
          .setValue(this.plugin.settings.temperature)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.temperature = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max Tokens")
      .setDesc("Maximum length of the generated output.")
      .addDropdown((drop) =>
        drop
          .addOption("2000", "2,000 (Short)")
          .addOption("4000", "4,000 (Medium)")
          .addOption("8000", "8,000 (Long)")
          .setValue(String(this.plugin.settings.maxTokens))
          .onChange(async (value) => {
            this.plugin.settings.maxTokens = parseInt(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Output").setHeading();

    new Setting(containerEl)
      .setName("Output Folder")
      .setDesc("Where synthesized notes will be saved in your vault.")
      .addText((text) =>
        text
          .setPlaceholder("Literature Reviews")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Citation Format")
      .setDesc("Default citation style for generated reviews.")
      .addDropdown((drop) =>
        drop
          .addOption("APA", "APA")
          .addOption("MLA", "MLA")
          .addOption("Chicago", "Chicago")
          .addOption("Harvard", "Harvard")
          .setValue(this.plugin.settings.citationFormat)
          .onChange(async (value: "APA" | "MLA" | "Chicago" | "Harvard") => {
            this.plugin.settings.citationFormat = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("License").setHeading();

    if (this.plugin.settings.isProActivated) {
      containerEl.createEl("p", {
        text: "✅ Pro license active — unlimited syntheses unlocked.",
      });

      new Setting(containerEl)
        .setName("Deactivate License")
        .setDesc("Remove the Pro license from this device.")
        .addButton((btn) =>
          btn
            .setButtonText("Deactivate")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.isProActivated = false;
              this.plugin.settings.licenseKey = "";
              this.plugin.settings.licenseEmail = "";
              await this.plugin.saveSettings();
              new Notice("License deactivated.");
              this.display();
            })
        );
    } else {
      const remaining = Math.max(
        0,
        FREE_TIER_MONTHLY_LIMIT - this.plugin.settings.monthlyUsageCount
      );
      containerEl.createEl("p", {
        text: `Free tier: ${this.plugin.settings.monthlyUsageCount} / ${FREE_TIER_MONTHLY_LIMIT} syntheses used this month (${remaining} remaining).`,
      });

      new Setting(containerEl)
        .setName("Upgrade to Pro")
        .setDesc("Unlimited syntheses, one-time payment, no subscription. Free tier limits are getting stricter soon — lock in early access now with code PRODUCTHUNT (valid 1 month).")
        .addButton((button) => {
          button
            .setButtonText("Get Pro license")
            .onClick(() => {
              window.open(GUMROAD_URL, "_blank");
            });
        });

      new Setting(containerEl)
        .setName("License Email")
        .setDesc("The email address used when purchasing.")
        .addText((text) =>
          text
            .setPlaceholder("you@example.com")
            .setValue(this.plugin.settings.licenseEmail)
            .onChange(async (value) => {
              this.plugin.settings.licenseEmail = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName("License Key")
        .setDesc("Enter your license key to unlock Pro features.")
        .addText((text) => {
          text
            .setPlaceholder("Paste your license key here")
            .setValue(this.plugin.settings.licenseKey)
            .onChange(async (value) => {
              this.plugin.settings.licenseKey = value.trim();
              await this.plugin.saveSettings();
            });
          text.inputEl.setCssStyles({ width: "100%" });
        });

      new Setting(containerEl)
        .setName("Activate Pro License")
        .setDesc("Validate and activate your Pro license key.")
        .addButton((btn) =>
          btn
            .setButtonText("Activate")
            .setCta()
            .onClick(async () => {
              const email = this.plugin.settings.licenseEmail;
              const key = this.plugin.settings.licenseKey;

              if (!email || !key) {
                new Notice("❌ Please enter both your email and license key.");
                return;
              }

              btn.setButtonText("Validating...").setDisabled(true);

              const result = await validateLicense(key, email);

              btn.setButtonText("Activate").setDisabled(false);

              if (result.valid) {
                this.plugin.settings.isProActivated = true;
                await this.plugin.saveSettings();
                new Notice("🎉 Pro license activated! All features unlocked.");
                this.display();
              } else {
                new Notice(`❌ ${result.error}`);
              }
            })
        );
    }
  }
}
