import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Only PDF, DOC, or DOCX files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (ext === "pdf") {
      // Dynamically require pdf-parse to avoid build issues
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      // For doc/docx, return placeholder - user can expand with mammoth
      return NextResponse.json({
        error:
          "DOC/DOCX parsing requires additional setup. Please use PDF format.",
      }, { status: 400 });
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be image-based or protected." },
        { status: 422 }
      );
    }

    // Parse sections from raw text
    const sections = parseResumeSections(text);

    return NextResponse.json({
      success: true,
      rawText: text,
      sections,
      wordCount: text.split(/\s+/).length,
    });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 }
    );
  }
}

interface ParsedSection {
  id: string;
  title: string;
  content: string;
}

function parseResumeSections(text: string): ParsedSection[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const SECTION_PATTERNS: { id: string; title: string; patterns: RegExp[] }[] = [
    {
      id: "summary",
      title: "Professional Summary",
      patterns: [/^(professional\s+)?summary$/i, /^objective$/i, /^profile$/i, /^about\s+me$/i],
    },
    {
      id: "experience",
      title: "Work Experience",
      patterns: [/^(work\s+)?experience$/i, /^employment(history)?$/i, /^career$/i, /^internship/i],
    },
    {
      id: "education",
      title: "Education",
      patterns: [/^education(al)?\s*(background|qualifications)?$/i, /^academic/i],
    },
    {
      id: "skills",
      title: "Technical Skills",
      patterns: [/^(technical\s+)?skills?$/i, /^competencies$/i, /^technologies$/i, /^expertise$/i],
    },
    {
      id: "projects",
      title: "Projects",
      patterns: [/^projects?$/i, /^(key\s+)?achievements?\s+&\s+projects?$/i, /^portfolio$/i],
    },
    {
      id: "achievements",
      title: "Achievements & Certifications",
      patterns: [/^(achievements?|awards?|certifications?|honors?)(\s*(&|and)\s*(achievements?|awards?|certifications?))?$/i],
    },
  ];

  const sectionMap: Record<string, string[]> = {};
  let currentSection: string | null = null;
  const headerLines = new Set<number>();

  // Detect section headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const sec of SECTION_PATTERNS) {
      if (sec.patterns.some((p) => p.test(line))) {
        currentSection = sec.id;
        if (!sectionMap[currentSection]) sectionMap[currentSection] = [];
        headerLines.add(i);
        break;
      }
    }
    if (currentSection && !headerLines.has(i)) {
      sectionMap[currentSection].push(line);
    }
  }

  // Build results — only include sections that have content
  const results: ParsedSection[] = [];
  for (const sec of SECTION_PATTERNS) {
    const content = (sectionMap[sec.id] || []).join("\n").trim();
    if (content.length > 10) {
      results.push({ id: sec.id, title: sec.title, content });
    }
  }

  // If no sections detected, put everything in summary
  if (results.length === 0) {
    results.push({
      id: "summary",
      title: "Resume Content",
      content: text.trim(),
    });
  }

  return results;
}
