# Literature Review Synthesizer

> An Obsidian plugin that transforms your academic reading notes into structured literature review outputs using LLMs — entirely within your vault, with your own API key.

![Version](https://img.shields.io/badge/version-1.0.0-7c6af7)
![Obsidian](https://img.shields.io/badge/Obsidian-1.4%2B-7c6af7)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What It Does

PhD students and academic researchers read between 50 and 200 sources for a single literature review. Taking notes is the easy part. **Synthesizing them is the bottleneck.**

Literature Review Synthesizer connects your Obsidian reading notes directly to an LLM of your choice, and produces:

- **Thematic Synthesis** — Identifies recurring themes and patterns across your sources
- **Methodological Comparison Matrix** — Compares research designs, samples, and analysis methods *(Pro)*
- **Research Gap Analysis** — Surfaces what is missing, contested, or unresolved *(Pro)*
- **Draft Literature Review Section** — Produces a fluent, citation-ready draft *(Pro)*

All processing happens between your Obsidian and your chosen LLM provider. **Your notes and API key never leave your machine.**

---

## Key Features

- **Bring Your Own Key (BYOK)** — Works with OpenAI, Anthropic, or any OpenAI-compatible endpoint (OpenRouter, Ollama, etc.)
- **Zero data sovereignty compromise** — No cloud sync, no telemetry, no server
- **Folder or tag-based source selection** — Point it at any folder or tag in your vault
- **Structured output** — Results saved as new notes with frontmatter, backlinks, and timestamps
- **Citation format support** — APA, MLA, Chicago, Harvard
- **Free tier** — 3 syntheses per month at no cost
- **Pro tier** — Unlimited syntheses, all four modes, custom prompts

---

## Installation

### From Obsidian Community Plugins

1. Open Obsidian → Settings → Community Plugins
2. Search for "Literature Review Synthesizer"
3. Click Install, then Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/ibrh96-prog/literature-review-synthesizer/releases)
2. Extract into your vault's `.obsidian/plugins/literature-review-synthesizer/` folder
3. Enable the plugin in Settings → Community Plugins

---

## Setup

1. Open Settings → Literature Review Synthesizer
2. Choose your LLM provider (OpenAI or Anthropic)
3. Enter your API key
4. Optionally enter a Custom Base URL for OpenRouter or local models
5. Click **Test Connection** to verify

---

## Usage

1. Press `⌘/Ctrl + P` and run **Open Literature Review Synthesizer**
2. Select your source type: by folder or by tag
3. Choose a synthesis mode
4. Add optional context about your research focus
5. Click **Run Synthesis**

The generated note will open automatically in your vault under the `Literature Reviews` folder.

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Thematic Synthesis | ✅ 3/month | ✅ Unlimited |
| Methodological Comparison | ❌ | ✅ |
| Research Gap Analysis | ❌ | ✅ |
| Draft Literature Review | ❌ | ✅ |
| All LLM providers | ✅ | ✅ |
| Custom Base URL | ✅ | ✅ |

**Get Pro:** [Purchase on Gumroad](https://ibrh96.gumroad.com/l/pkpmfj)

---

## Privacy

- Your API key is stored locally in Obsidian's plugin data
- Your notes are sent only to your chosen LLM provider, not to any server controlled by this plugin's developer
- No analytics, no telemetry, no tracking of any kind
- **Network use:** This plugin sends your note content to the LLM provider you configure (OpenAI, Anthropic, or a compatible endpoint). No data is sent to the plugin developer's servers. Internet access is required only for LLM API calls.

---

## Supported LLM Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude Opus, Claude Sonnet, Claude Haiku |
| OpenRouter | Any model via custom base URL |
| Ollama | Any local model via custom base URL |

---

## Requirements

- Obsidian 1.4 or later
- An API key from a supported LLM provider
- Desktop only (Windows, macOS, Linux)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Support

For bug reports and feature requests, please open an issue on GitHub.
For license activation issues, open a GitHub Issue in this repository.
