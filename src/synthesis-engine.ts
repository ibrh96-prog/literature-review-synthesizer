import { App, Notice, TFolder } from "obsidian";
import { LiteratureReviewSettings, FREE_TIER_LIFETIME_LIMIT } from "./settings";
import { LLMProvider } from "./llm-provider";
import { NoteCollector, CollectedNote } from "./note-collector";
import { SynthesisMode, SYNTHESIS_MODE_LABELS, getSystemPrompt, getPromptForMode } from "./prompts";

export interface SynthesisRequest {
  mode: SynthesisMode;
  sourceType: "folder" | "tag" | "files";
  folderPath?: string;
  tag?: string;
  filePaths?: string[];
  userContext: string;
}

export interface SynthesisResult {
  content: string;
  noteTitle: string;
  notePath: string;
  sourceCount: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export class SynthesisEngine {
  private app: App;
  private settings: LiteratureReviewSettings;
  private llmProvider: LLMProvider;
  private noteCollector: NoteCollector;
  private saveSettings: () => Promise<void>;

  constructor(
    app: App,
    settings: LiteratureReviewSettings,
    llmProvider: LLMProvider,
    noteCollector: NoteCollector,
    saveSettings: () => Promise<void>
  ) {
    this.app = app;
    this.settings = settings;
    this.llmProvider = llmProvider;
    this.noteCollector = noteCollector;
    this.saveSettings = saveSettings;
  }

  async run(request: SynthesisRequest): Promise<SynthesisResult> {
    // ── 1. Check free tier limit ──────────────────────────────
    if (!this.settings.isProActivated) {
      if (this.settings.lifetimeUsageCount >= FREE_TIER_LIFETIME_LIMIT) {
        throw new Error(
          `Free tier limit reached (${FREE_TIER_LIFETIME_LIMIT} syntheses total). ` +
          `Please activate a Pro license to continue.`
        );
      }
      // Reserve the slot immediately before any await, then persist it.
      // If the work below fails we refund in the catch block.
      this.settings.lifetimeUsageCount += 1;
      await this.saveSettings();
    }

    // ── 2-5. Collect notes, call LLM, write output note ───────
    try {
      new Notice("Collecting notes...");
      let notes: CollectedNote[];

      if (request.sourceType === "folder" && request.folderPath) {
        notes = await this.noteCollector.collectFromFolder(request.folderPath);
      } else if (request.sourceType === "tag" && request.tag) {
        notes = await this.noteCollector.collectFromTag(request.tag);
      } else if (request.sourceType === "files" && request.filePaths) {
        notes = await this.noteCollector.collectFromFiles(request.filePaths);
      } else {
        throw new Error("Invalid synthesis request: no source specified.");
      }

      if (notes.length === 0) {
        throw new Error("No notes found for the selected source. Please check your folder path or tag.");
      }

      new Notice(`Found ${notes.length} notes. Sending to LLM...`);

      // ── 3. Format notes and build prompt ──────────────────────
      const formattedNotes = this.noteCollector.formatNotesForLLM(notes);
      const userPrompt = getPromptForMode(request.mode, formattedNotes, request.userContext);
      const systemPrompt = getSystemPrompt(this.settings);

      // ── 4. Call LLM ───────────────────────────────────────────
      const response = await this.llmProvider.sendMessage(
        [{ role: "user", content: userPrompt }],
        systemPrompt
      );

      // ── 5. Save output note ───────────────────────────────────
      const noteTitle = this.generateNoteTitle(request.mode);
      const noteContent = this.buildOutputNote(
        response.content,
        request,
        notes.map((n) => n.path),
        response.model
      );
      const notePath = await this.saveOutputNote(noteTitle, noteContent);

      new Notice(`✅ Synthesis complete! Saved to: ${notePath}`);

      return {
        content: response.content,
        noteTitle,
        notePath,
        sourceCount: notes.length,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        model: response.model,
      };
    } catch (error) {
      // Refund the reserved slot so the user can try again.
      if (!this.settings.isProActivated) {
        this.settings.lifetimeUsageCount -= 1;
        await this.saveSettings();
      }
      throw error;
    }
  }

  private generateNoteTitle(mode: SynthesisMode): string {
    const label = SYNTHESIS_MODE_LABELS[mode];
    const date = new Date().toISOString().split("T")[0];
    const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
    return `${label} — ${date} ${time}`;
  }

  private buildOutputNote(
    content: string,
    request: SynthesisRequest,
    sourcePaths: string[],
    model: string
  ): string {
    const date = new Date().toISOString();
    const modeLabel = SYNTHESIS_MODE_LABELS[request.mode];

    const sourceLinks = sourcePaths
      .map((p) => {
        const name = p.replace(/\.md$/, "");
        return `- [[${name}]]`;
      })
      .join("\n");

    let sourceDescription = "";
    if (request.sourceType === "folder") {
      sourceDescription = `folder: ${request.folderPath}`;
    } else if (request.sourceType === "tag") {
      sourceDescription = `tag: #${request.tag}`;
    } else {
      sourceDescription = `${sourcePaths.length} manually selected files`;
    }

    return `---
title: "${modeLabel}"
date: ${date}
synthesis_mode: ${request.mode}
source: ${sourceDescription}
model: ${model}
tags:
  - literature-review
  - synthesis
---

# ${modeLabel}

> Generated by Literature Review Synthesizer on ${date.split("T")[0]}
> Source: ${sourceDescription} (${sourcePaths.length} notes)
> Model: ${model}

---

${content}

---

## Source Notes

${sourceLinks}
`;
  }

  private async saveOutputNote(title: string, content: string): Promise<string> {
    const folder = this.settings.outputFolder || "Literature Reviews";

    // Create output folder if it doesn't exist
    const folderExists = this.app.vault.getAbstractFileByPath(folder);
    if (!folderExists) {
      await this.app.vault.createFolder(folder);
    }

    const fileName = `${title}.md`;
    const filePath = `${folder}/${fileName}`;

    await this.app.vault.create(filePath, content);
    return filePath;
  }

}