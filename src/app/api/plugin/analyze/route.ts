import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parsePDF } from "@/lib/scripts/parser";

const SYSTEM_PROMPT = `You are an expert casting director's assistant. You analyze casting documents — scripts, self-tape instructions, job information sheets — and extract comprehensive project details.

You will receive text from one or more casting documents. Extract ALL of the following:

1. PROJECT DETAILS: name, brand/client, type (commercial/film/tv_series/short_film/music_video/web_series/theatre/vertical_short), location, deadline dates, director, casting director, production dates.

2. ROLES: Every character including non-speaking/background. For each:
   - Exact name as written
   - Detailed description (2-3 sentences: age range, physical traits, personality, key characteristics)
   - Whether they are speaking or non-speaking
   - Gender if apparent
   - Age range if mentioned

3. SELF-TAPE INSTRUCTIONS: If the documents contain audition/self-tape instructions, extract them per role:
   - Video labels and descriptions
   - Photo requirements
   - Filming notes
   - Reference links mentioned

4. FORM QUESTIONS: If the documents mention talent forms or ask role-specific questions, extract them:
   - Question text
   - Type (text, radio, textarea, checkbox)
   - Options if applicable (yes/no, etc.)
   - Whether required

Rules:
- Include ALL roles, even background/extras (mark them as non-speaking)
- Be thorough with descriptions — casting directors need specifics
- Extract exact text for self-tape instructions, don't summarize
- Identify role-specific questions (like "Are you comfortable with X?" or "Tell us about your Y experience")

Return ONLY valid JSON matching this schema:
{
  "project": {
    "name": string,
    "brand": string,
    "type": string,
    "location": string | null,
    "deadline": string | null (YYYY-MM-DD),
    "director": string | null,
    "castingDirector": string | null,
    "productionDates": string | null
  },
  "roles": [
    {
      "name": string,
      "description": string,
      "ageRange": string | null,
      "gender": string | null,
      "speaking": boolean,
      "characteristics": string[]
    }
  ],
  "selfTapeInstructions": [
    {
      "roleName": string,
      "videos": [{ "label": string, "description": string }],
      "photos": string[],
      "filmingNotes": string[],
      "referenceLinks": string[]
    }
  ],
  "formQuestions": [
    {
      "roleName": string,
      "questions": [
        {
          "type": "text" | "radio" | "textarea" | "checkbox",
          "label": string,
          "options": string[] | null,
          "required": boolean
        }
      ]
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Extract text from all uploaded files
    const allTexts: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const { text } = await parsePDF(buffer);
        allTexts.push(`=== DOCUMENT: ${file.name} ===\n${text}`);
      } else {
        // For non-PDF, try to read as text
        allTexts.push(`=== DOCUMENT: ${file.name} ===\n${buffer.toString("utf-8")}`);
      }
    }

    const combinedText = allTexts.join("\n\n");

    // Call Claude API
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze these casting documents and extract all project information:\n\n${combinedText}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Plugin analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
