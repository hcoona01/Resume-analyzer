import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

interface LinkedInProfile {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{ title: string; company: string; duration: string; description: string }>;
  education?: Array<{ school: string; degree: string; field: string; years: string; grade: string }>;
  certifications?: Array<{ name: string; issuer: string; year: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sections, linkedinProfile, jobDescription } = body as {
      sections: ResumeSection[];
      linkedinProfile?: LinkedInProfile | null;
      jobDescription?: string;
    };

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: "No resume sections provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const resumeText = sections
      .map((s) => `=== ${s.title.toUpperCase()} ===\n${s.content}`)
      .join("\n\n");

    const linkedinText = linkedinProfile
      ? buildLinkedInContext(linkedinProfile)
      : null;

    const prompt = buildPrompt(resumeText, linkedinText, jobDescription);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from Gemini response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini JSON:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (err) {
    console.error("AI scan error:", err);
    return NextResponse.json(
      { error: "AI analysis failed. Please check your Gemini API key and try again." },
      { status: 500 }
    );
  }
}

function buildLinkedInContext(profile: LinkedInProfile): string {
  const parts: string[] = [];

  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.headline) parts.push(`Headline: ${profile.headline}`);
  if (profile.summary) parts.push(`Summary: ${profile.summary}`);

  if (profile.skills?.length) {
    parts.push(`LinkedIn Skills: ${profile.skills.join(", ")}`);
  }

  if (profile.experience?.length) {
    const exp = profile.experience
      .map((e) => `- ${e.title} at ${e.company} (${e.duration})`)
      .join("\n");
    parts.push(`LinkedIn Experience:\n${exp}`);
  }

  if (profile.certifications?.length) {
    const certs = profile.certifications
      .map((c) => `- ${c.name} by ${c.issuer}`)
      .join("\n");
    parts.push(`LinkedIn Certifications:\n${certs}`);
  }

  return parts.join("\n");
}

function buildPrompt(
  resumeText: string,
  linkedinContext: string | null,
  jobDescription?: string
): string {
  const linkedinSection = linkedinContext
    ? `\n\n## LINKEDIN PROFILE DATA\n${linkedinContext}\n\nIMPORTANT: Compare the resume against the LinkedIn data and flag any:\n- Skills present on LinkedIn but missing from resume\n- Roles/experience on LinkedIn not reflected in resume\n- Certifications on LinkedIn not listed on resume\n- Inconsistencies between platforms`
    : "";

  const jdSection = jobDescription
    ? `\n\n## TARGET JOB DESCRIPTION\n${jobDescription}\n\nMatch the resume against this JD and identify gaps.`
    : "";

  return `You are an expert ATS (Applicant Tracking System) analyst and professional resume coach. Analyze the following resume comprehensively.${linkedinSection}${jdSection}

## RESUME CONTENT
${resumeText}

## YOUR TASK
Provide a detailed ATS analysis. Return ONLY a valid JSON object (no markdown, no explanation outside JSON) with this exact structure:

{
  "atsScore": <number 0-100>,
  "scoreBreakdown": {
    "keywords": <number 0-25>,
    "formatting": <number 0-25>,
    "metrics": <number 0-25>,
    "completeness": <number 0-25>
  },
  "overallAssessment": "<2-3 sentence summary of the resume's ATS readiness>",
  "suggestions": [
    {
      "id": "<unique string>",
      "type": "<'critical' | 'warning' | 'improvement' | 'linkedin_gap' | 'tip'>",
      "section": "<section name>",
      "message": "<short headline for the issue, max 10 words>",
      "suggestion": "<specific, actionable advice with examples, 1-3 sentences>",
      "priority": <number 1-5, 1=highest>
    }
  ],
  "missingKeywords": ["<keyword1>", "<keyword2>"],
  "strengthAreas": ["<strength1>", "<strength2>"],
  "quickWins": ["<actionable quick win 1>", "<actionable quick win 2>", "<actionable quick win 3>"],
  "linkedinGaps": ${linkedinContext ? '["<gap1>", "<gap2>"]' : "[]"}
}

Rules for suggestions:
- Provide 6-12 specific, actionable suggestions
- 'critical' = must fix (ATS will reject), 'warning' = should fix, 'improvement' = nice to have, 'linkedin_gap' = only if LinkedIn data provided, 'tip' = best practice
- Be VERY specific — name exact sections, suggest exact wording improvements
- Focus on: action verbs, quantified metrics, ATS keywords, formatting, LinkedIn consistency
- Sort by priority (1 = most urgent)
- missingKeywords: list 5-10 high-demand tech keywords missing from resume
- strengthAreas: list 3-5 things the candidate does well
- quickWins: 3 things they can fix in under 5 minutes`;
}
