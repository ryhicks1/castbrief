/**
 * AI-powered script analysis using Claude
 * Extracts roles, descriptions, and page numbers from screenplay text
 */
import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedRole {
  name: string;
  description: string; // ≤20 words
  pageNumbers: number[];
}

export interface ScriptBreakdown {
  title: string;
  roles: ExtractedRole[];
}

const SYSTEM_PROMPT = `You are a professional casting director's assistant. Analyze screenplays and extract character information for casting briefs.

Your job is to:
1. Identify the script's title
2. Extract ALL speaking characters (not extras or background)
3. For each character, provide:
   - Their exact name as written in the script
   - A casting-focused description in 20 words or fewer (age range, personality, key traits, relationship to other characters)
   - The page numbers where they have dialogue or significant action

Rules:
- Description should be useful for casting: include age range if inferable, physical descriptions if mentioned, and personality traits
- Only include characters with actual dialogue or named stage directions
- Page numbers should be approximate if the text doesn't have clear page markers
- Sort characters by importance (most dialogue/screen time first)
- Combine character names that are clearly the same person (e.g., "JOHN" and "JOHN (CONT'D)")

Respond with valid JSON only. No markdown, no code blocks, just JSON.`;

const USER_PROMPT = `Analyze this screenplay and extract all speaking roles. Return JSON in this exact format:

{
  "title": "Script Title",
  "roles": [
    {
      "name": "CHARACTER NAME",
      "description": "Brief casting description, 20 words max",
      "pageNumbers": [1, 3, 5, 7]
    }
  ]
}

Here is the screenplay text:

`;

export async function analyzeScript(scriptText: string): Promise<ScriptBreakdown> {
  const client = new Anthropic();

  // Truncate very long scripts to fit context (keep first ~150k chars)
  const truncatedText =
    scriptText.length > 150000
      ? scriptText.slice(0, 150000) + "\n\n[Script truncated for analysis]"
      : scriptText;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: USER_PROMPT + truncatedText,
      },
    ],
  });

  // Extract text response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parse JSON — handle potential markdown code blocks
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const breakdown: ScriptBreakdown = JSON.parse(jsonStr);

  // Validate structure
  if (!breakdown.title || !Array.isArray(breakdown.roles)) {
    throw new Error("Invalid response structure from AI");
  }

  // Enforce 20-word description limit
  for (const role of breakdown.roles) {
    const words = role.description.split(/\s+/);
    if (words.length > 25) {
      role.description = words.slice(0, 20).join(" ") + "...";
    }
  }

  return breakdown;
}
