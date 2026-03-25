/**
 * AI-powered project document analysis using Claude
 * Extracts project details, roles, self-tape instructions, and form questions
 * from uploaded casting documents (scripts, self-tape docs, job info sheets)
 */
import Anthropic from "@anthropic-ai/sdk";

export interface ProjectAnalysis {
  project: {
    name: string;
    brand: string;
    type:
      | "film"
      | "commercial"
      | "tv_series"
      | "short_film"
      | "music_video"
      | "web_series"
      | "theatre"
      | "vertical_short";
    location: string;
    deadline: string | null;
    director: string | null;
    castingDirector: string | null;
    productionDates: string | null;
  };
  roles: Array<{
    name: string;
    description: string;
    ageRange: string | null;
    gender: string | null;
    speaking: boolean;
    characteristics: string[];
  }>;
  selfTapeInstructions: Array<{
    roleName: string;
    videos: Array<{ label: string; description: string }>;
    photos: string[];
    filmingNotes: string[];
    referenceLinks: string[];
  }>;
  formQuestions: Array<{
    roleName: string;
    questions: Array<{
      type: "text" | "radio" | "textarea" | "checkbox";
      label: string;
      options?: string[];
      required: boolean;
    }>;
  }>;
}

const SYSTEM_PROMPT = `You are an expert casting coordinator assistant. You analyze casting documents — scripts, self-tape instruction sheets, job info documents, casting breakdowns — and extract structured data for setting up a casting project.

Your job is to:
1. Identify the project (name, brand/studio, type, location, deadlines, key crew)
2. Extract ALL characters/roles including non-speaking and background roles
3. Extract role-specific audition/self-tape instructions if present
4. Extract any custom form questions that talent need to answer
5. Merge information intelligently when multiple documents describe the same project

Rules:
- For each role, provide a detailed 2-3 sentence description useful for casting
- Include age range and gender when mentioned or inferable
- Mark roles as speaking or non-speaking based on whether they have dialogue
- Include ALL roles, even extras, featured background, and minor parts
- For self-tape instructions, extract video requirements, photo requirements, filming notes, and any reference links per role
- For form questions, extract any custom questions the production wants talent to answer (NOT standard fields like name, email, phone, location — those are always included automatically)
- If a document contains self-tape instructions for specific roles, match them to the correct role by name
- Project type must be one of: film, commercial, tv_series, short_film, music_video, web_series, theatre, vertical_short
- Respond with valid JSON only. No markdown, no code blocks, just the JSON object.`;

const USER_PROMPT = `Analyze these casting documents and extract all project information, roles, self-tape instructions, and form questions. Return JSON in this exact format:

{
  "project": {
    "name": "Project Name",
    "brand": "Studio or Brand Name",
    "type": "film",
    "location": "City, State/Country",
    "deadline": "2025-01-15" or null,
    "director": "Director Name" or null,
    "castingDirector": "CD Name" or null,
    "productionDates": "Jan 15 - Feb 28, 2025" or null
  },
  "roles": [
    {
      "name": "CHARACTER NAME",
      "description": "2-3 sentence casting description with personality, relationship to story, and key traits.",
      "ageRange": "25-35" or null,
      "gender": "Female" or null,
      "speaking": true,
      "characteristics": ["athletic", "comedic timing", "bilingual Spanish"]
    }
  ],
  "selfTapeInstructions": [
    {
      "roleName": "CHARACTER NAME",
      "videos": [
        { "label": "Scene 1 — Monologue", "description": "Perform the monologue from page 12. Start from 'I never thought...' to the end of the scene." }
      ],
      "photos": ["Headshot — natural lighting, no makeup", "Full body shot"],
      "filmingNotes": ["Shoot landscape/horizontal", "Solid background, no patterns"],
      "referenceLinks": ["https://example.com/reference"]
    }
  ],
  "formQuestions": [
    {
      "roleName": "CHARACTER NAME",
      "questions": [
        { "type": "radio", "label": "Are you comfortable with on-screen kissing?", "options": ["Yes", "No", "Depends on context"], "required": true },
        { "type": "text", "label": "List any special skills relevant to this role", "required": false }
      ]
    }
  ]
}

If there are no self-tape instructions in the documents, return an empty array for selfTapeInstructions.
If there are no custom form questions, return an empty array for formQuestions.
If a field is not mentioned in the documents, use reasonable defaults or null.

Here are the documents:

`;

export async function analyzeProjectDocuments(
  texts: string[]
): Promise<ProjectAnalysis> {
  const client = new Anthropic();

  const combinedText = texts.join(
    "\n\n===== NEXT DOCUMENT =====\n\n"
  );

  // Truncate very long combined text to fit context
  const truncatedText =
    combinedText.length > 150000
      ? combinedText.slice(0, 150000) +
        "\n\n[Documents truncated for analysis]"
      : combinedText;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
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

  const analysis: ProjectAnalysis = JSON.parse(jsonStr);

  // Validate structure
  if (!analysis.project || !Array.isArray(analysis.roles)) {
    throw new Error("Invalid response structure from AI");
  }

  // Ensure arrays exist
  if (!Array.isArray(analysis.selfTapeInstructions)) {
    analysis.selfTapeInstructions = [];
  }
  if (!Array.isArray(analysis.formQuestions)) {
    analysis.formQuestions = [];
  }

  return analysis;
}
