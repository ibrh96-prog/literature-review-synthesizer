import { App, TFile, TFolder, CachedMetadata } from "obsidian";

export interface CollectedNote {
  title: string;
  content: string;
  path: string;
  tags: string[];
}

export class NoteCollector {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async collectFromFolder(folderPath: string): Promise<CollectedNote[]> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);

    if (!folder || !(folder instanceof TFolder)) {
      throw new Error(`Folder not found: ${folderPath}`);
    }

    const notes: CollectedNote[] = [];
    const files = this.getMarkdownFilesInFolder(folder);

    for (const file of files) {
      const note = await this.readNote(file);
      notes.push(note);
    }

    return notes;
  }

  async collectFromTag(tag: string): Promise<CollectedNote[]> {
    const normalizedTag = tag.startsWith("#") ? tag.slice(1) : tag;
    const allFiles = this.app.vault.getMarkdownFiles();
    const notes: CollectedNote[] = [];

    for (const file of allFiles) {
      const cache = this.app.metadataCache.getFileCache(file);
      const fileTags = this.extractTags(cache);

      if (fileTags.includes(normalizedTag)) {
        const note = await this.readNote(file);
        notes.push(note);
      }
    }

    return notes;
  }

  async collectFromFiles(filePaths: string[]): Promise<CollectedNote[]> {
    const notes: CollectedNote[] = [];

    for (const path of filePaths) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile && file.extension === "md") {
        const note = await this.readNote(file);
        notes.push(note);
      }
    }

    return notes;
  }

  private async readNote(file: TFile): Promise<CollectedNote> {
    const content = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    const tags = this.extractTags(cache);

    return {
      title: file.basename,
      content: content,
      path: file.path,
      tags: tags,
    };
  }

  private getMarkdownFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];

    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        files.push(child);
      } else if (child instanceof TFolder) {
        files.push(...this.getMarkdownFilesInFolder(child));
      }
    }

    return files;
  }

  private extractTags(cache: CachedMetadata | null): string[] {
    const tags: string[] = [];

    if (cache?.tags) {
      for (const tagObj of cache.tags) {
        tags.push(tagObj.tag.replace("#", ""));
      }
    }

    if (cache?.frontmatter?.tags) {
      const fmTags = cache.frontmatter.tags as unknown;
      if (Array.isArray(fmTags)) {
        tags.push(...(fmTags as string[]));
      } else if (typeof fmTags === "string") {
        tags.push(fmTags);
      }
    }

    return [...new Set(tags)];
  }

  formatNotesForLLM(notes: CollectedNote[]): string {
    if (notes.length === 0) {
      return "No notes found.";
    }

    return notes
      .map((note, index) => {
        return `--- NOTE ${index + 1}: ${note.title} ---\n${note.content}\n`;
      })
      .join("\n");
  }
}