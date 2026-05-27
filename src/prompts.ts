import { LiteratureReviewSettings } from "./settings";

export type SynthesisMode =
  | "thematic"
  | "methodological"
  | "gap-analysis"
  | "draft-review";

export const SYNTHESIS_MODE_LABELS: Record<SynthesisMode, string> = {
  thematic: "Thematic Synthesis",
  methodological: "Methodological Comparison Matrix",
  "gap-analysis": "Research Gap Analysis",
  "draft-review": "Draft Literature Review Section",
};

export function getSystemPrompt(settings: LiteratureReviewSettings): string {
  return `You are an expert academic research assistant specializing in literature synthesis. 
Your task is to analyze a collection of academic reading notes and produce high-quality, 
structured synthesis outputs suitable for doctoral-level academic writing.

Citation format: ${settings.citationFormat}
Academic tone: ${settings.academicTone}
Output length: ${settings.outputLength}

Rules:
- Write in formal academic prose unless told otherwise.
- Do not invent sources, findings, or citations not present in the notes.
- Ground every claim in the provided notes.
- Use the citation format specified above when referencing sources.
- Output length guidance: short = ~300 words, medium = ~600 words, long = ~1200 words.`;
}

export function getThematicSynthesisPrompt(
  formattedNotes: string,
  userContext: string
): string {
  return `You are given a set of academic reading notes below. Your task is to produce a THEMATIC SYNTHESIS.

A thematic synthesis identifies recurring themes, patterns, and concepts across multiple sources. 
It groups findings by theme rather than by source, showing how different authors contribute to each theme.

${userContext ? `Additional context from the researcher: ${userContext}\n` : ""}

Structure your output as follows:
1. **Overview** — A brief paragraph summarizing the body of literature covered.
2. **Identified Themes** — For each major theme:
   - Theme name as a heading
   - Synthesis of what the notes collectively say about this theme
   - Which sources support, contradict, or nuance each other
3. **Cross-Cutting Observations** — Patterns that span multiple themes.
4. **Limitations of This Synthesis** — What is missing or uncertain based on the notes provided.

--- NOTES BEGIN ---
${formattedNotes}
--- NOTES END ---

Now produce the thematic synthesis:`;
}

export function getMethodologicalPrompt(
  formattedNotes: string,
  userContext: string
): string {
  return `You are given a set of academic reading notes below. Your task is to produce a METHODOLOGICAL COMPARISON.

Analyze the research methods used across the studies described in the notes. 
Identify methodological patterns, contrasts, strengths, and weaknesses.

${userContext ? `Additional context from the researcher: ${userContext}\n` : ""}

Structure your output as follows:
1. **Overview of Methodological Landscape** — Summary of approaches represented.
2. **Comparison Table** — A markdown table with columns: Source | Design | Sample | Data Collection | Analysis Method | Key Limitation
3. **Methodological Patterns** — What approaches dominate and why.
4. **Methodological Gaps** — What methods are absent or underused.

--- NOTES BEGIN ---
${formattedNotes}
--- NOTES END ---

Now produce the methodological comparison:`;
}

export function getGapAnalysisPrompt(
  formattedNotes: string,
  userContext: string
): string {
  return `You are given a set of academic reading notes below. Your task is to produce a RESEARCH GAP ANALYSIS.

Identify what is missing, understudied, contradicted, or unresolved in the existing literature 
as represented by these notes.

${userContext ? `Additional context from the researcher: ${userContext}\n` : ""}

Structure your output as follows:
1. **Summary of Existing Coverage** — What the literature has addressed well.
2. **Identified Gaps** — For each gap:
   - Gap description
   - Evidence from the notes that this gap exists
   - Significance of the gap
3. **Contradictions and Debates** — Areas where sources disagree.
4. **Recommended Directions** — Specific research questions this gap analysis suggests.

--- NOTES BEGIN ---
${formattedNotes}
--- NOTES END ---

Now produce the research gap analysis:`;
}

export function getDraftReviewPrompt(
  formattedNotes: string,
  userContext: string
): string {
  return `You are given a set of academic reading notes below. Your task is to produce a DRAFT LITERATURE REVIEW SECTION.

Write a fluent, academically styled literature review section as it would appear in a dissertation 
or journal article. Synthesize the sources into a cohesive narrative with proper in-text citations.

${userContext ? `Additional context from the researcher: ${userContext}\n` : ""}

Requirements:
- Write in continuous academic prose (not bullet points).
- Use in-text citations in the specified format.
- Organize by theme, not by source.
- Include transitions between ideas.
- End with a paragraph identifying gaps or the rationale for further research.

--- NOTES BEGIN ---
${formattedNotes}
--- NOTES END ---

Now produce the draft literature review section:`;
}

export function getPromptForMode(
  mode: SynthesisMode,
  formattedNotes: string,
  userContext: string
): string {
  switch (mode) {
    case "thematic":
      return getThematicSynthesisPrompt(formattedNotes, userContext);
    case "methodological":
      return getMethodologicalPrompt(formattedNotes, userContext);
    case "gap-analysis":
      return getGapAnalysisPrompt(formattedNotes, userContext);
    case "draft-review":
      return getDraftReviewPrompt(formattedNotes, userContext);
  }
}