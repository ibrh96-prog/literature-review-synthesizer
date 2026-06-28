import { App, Modal, Setting, Notice, TFolder } from "obsidian";
import LiteratureReviewSynthesizer from "./main";
import { SynthesisMode, SYNTHESIS_MODE_LABELS } from "./prompts";
import { SynthesisEngine } from "./synthesis-engine";
import { GUMROAD_URL } from "./license-validator";

export class SynthesisModal extends Modal {
  plugin: LiteratureReviewSynthesizer;
  selectedMode: SynthesisMode = "thematic";
  sourceType: "folder" | "tag" = "folder";
  folderPath: string = "";
  tag: string = "";
  userContext: string = "";
  isRunning: boolean = false;

  constructor(app: App, plugin: LiteratureReviewSynthesizer) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Literature Review Synthesizer" });

    // ── SOURCE TYPE ───────────────────────────────────────────
    new Setting(contentEl)
      .setName("Source Type")
      .setDesc("How do you want to select your notes?")
      .addDropdown((drop) =>
        drop
          .addOption("folder", "By Folder")
          .addOption("tag", "By Tag")
          .setValue(this.sourceType)
          .onChange((value: "folder" | "tag") => {
            this.sourceType = value;
            this.onOpen();
          })
      );

    if (this.sourceType === "folder") {
      new Setting(contentEl)
        .setName("Folder Path")
        .setDesc("Enter the vault folder path containing your reading notes.")
        .addText((text) =>
          text
            .setPlaceholder("e.g. Reading Notes/Education")
            .setValue(this.folderPath)
            .onChange((value) => {
              this.folderPath = value.trim();
            })
        );
    }

    if (this.sourceType === "tag") {
      new Setting(contentEl)
        .setName("Tag")
        .setDesc("Enter a tag to collect all notes with that tag.")
        .addText((text) =>
          text
            .setPlaceholder("e.g. education-research")
            .setValue(this.tag)
            .onChange((value) => {
              this.tag = value.trim().replace(/^#/, "");
            })
        );
    }

    // ── SYNTHESIS MODE ────────────────────────────────────────
    new Setting(contentEl)
      .setName("Synthesis Mode")
      .setDesc("Choose the type of synthesis to generate.")
      .addDropdown((drop) => {
        drop.addOption("thematic", SYNTHESIS_MODE_LABELS["thematic"]);

        if (this.plugin.settings.isProActivated) {
          drop.addOption("methodological", SYNTHESIS_MODE_LABELS["methodological"]);
          drop.addOption("gap-analysis", SYNTHESIS_MODE_LABELS["gap-analysis"]);
          drop.addOption("draft-review", SYNTHESIS_MODE_LABELS["draft-review"]);
        }

        return drop
          .setValue(this.selectedMode)
          .onChange((value: SynthesisMode) => {
            this.selectedMode = value;
          });
      });

    if (!this.plugin.settings.isProActivated) {
      contentEl.createEl("p", {
        text: "🔒 Methodological Comparison, Gap Analysis, and Draft Review are Pro features. Activate your license in Settings to unlock them.",
        cls: "setting-item-description",
      });
    }

    // ── USER CONTEXT ──────────────────────────────────────────
    new Setting(contentEl)
      .setName("Additional Context (optional)")
      .setDesc("Tell the AI what you are working on or what to focus on.")
      .addTextArea((text) =>
        text
          .setPlaceholder(
            "e.g. I am writing a dissertation chapter on formative assessment in higher education. Focus on themes related to feedback and student agency."
          )
          .setValue(this.userContext)
          .onChange((value) => {
            this.userContext = value;
          })
      );

    // ── FREE TIER STATUS ──────────────────────────────────────
    if (!this.plugin.settings.isProActivated) {
      const remaining =
        Math.max(
          0,
          3 - this.plugin.settings.monthlyUsageCount
        );
      contentEl.createEl("p", {
        text: `Free tier: ${remaining} synthesis remaining this month.`,
        cls: "setting-item-description",
      });

      new Setting(contentEl)
        .setName("Upgrade to Pro")
        .setDesc("Unlimited syntheses, one-time payment, no subscription. Free tier limits are getting stricter soon — lock in early access now with code gcw63tz (valid 1 month).")
        .addButton((button) => {
          button
            .setButtonText("Get Pro license")
            .onClick(() => {
              window.open(GUMROAD_URL, "_blank");
            });
        });
    }

    // ── RUN BUTTON ────────────────────────────────────────────
    const buttonSetting = new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Run Synthesis")
        .setCta()
        .onClick(async () => {
          await this.runSynthesis(btn);
        });
    });
  }

  async runSynthesis(btn: any) {
    if (this.isRunning) return;

    // Validate inputs
    if (!this.plugin.llmProvider) {
      new Notice("❌ No API key configured. Please add your API key in Settings.");
      return;
    }

    if (this.sourceType === "folder" && !this.folderPath) {
      new Notice("❌ Please enter a folder path.");
      return;
    }

    if (this.sourceType === "tag" && !this.tag) {
      new Notice("❌ Please enter a tag.");
      return;
    }

    this.isRunning = true;
    btn.setButtonText("Running...").setDisabled(true);

    try {
      const engine = new SynthesisEngine(
        this.app,
        this.plugin.settings,
        this.plugin.llmProvider,
        this.plugin.noteCollector
      );

      const result = await engine.run({
        mode: this.selectedMode,
        sourceType: this.sourceType,
        folderPath: this.folderPath,
        tag: this.tag,
        userContext: this.userContext,
      });

      await this.plugin.saveSettings();

      this.close();

      // Open the generated note
      const file = this.app.vault.getAbstractFileByPath(result.notePath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }

      new Notice(
        `✅ Done! Synthesized ${result.sourceCount} notes → ${result.noteTitle}` +
        ` (${result.inputTokens + result.outputTokens} tokens used)`
      );
    } catch (error) {
      if (error.message && error.message.includes("Free tier limit reached")) {
        new ProUpgradeModal(this.app).open();
      } else {
        new Notice(`❌ Synthesis failed: ${error.message}`);
      }
      btn.setButtonText("Run Synthesis").setDisabled(false);
    } finally {
      this.isRunning = false;
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class ProUpgradeModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Free limit reached" });
    contentEl.createEl("p", {
      text: "You've used all your free syntheses this month. Upgrade to Pro for unlimited syntheses, one-time payment, no subscription. Free tier limits are getting stricter soon — lock in early access now with code gcw63tz (valid 1 month).",
    });
    const buttonRow = contentEl.createDiv();
    const proButton = buttonRow.createEl("button", { text: "Get Pro license" });
    proButton.addEventListener("click", () => {
      window.open(GUMROAD_URL, "_blank");
    });
    const closeButton = buttonRow.createEl("button", { text: "Got it" });
    closeButton.addEventListener("click", () => {
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}