"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Code,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  Info,
  Linkedin,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  User,
  Wand2,
  X,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResumeSection {
  id: string;
  title: string;
  content: string;
  icon: React.ElementType;
}

interface AISuggestion {
  id: string;
  type: "critical" | "warning" | "improvement" | "linkedin_gap" | "tip";
  section: string;
  message: string;
  suggestion: string;
  priority: number;
  applied?: boolean;
}

interface AIAnalysis {
  atsScore: number;
  scoreBreakdown: {
    keywords: number;
    formatting: number;
    metrics: number;
    completeness: number;
  };
  overallAssessment: string;
  suggestions: AISuggestion[];
  missingKeywords: string[];
  strengthAreas: string[];
  quickWins: string[];
  linkedinGaps: string[];
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

// ─── Default sections ─────────────────────────────────────────────────────────
const SECTION_META = [
  { id: "summary", title: "Professional Summary", icon: User },
  { id: "experience", title: "Work Experience", icon: Briefcase },
  { id: "education", title: "Education", icon: GraduationCap },
  { id: "skills", title: "Technical Skills", icon: Code },
  { id: "projects", title: "Projects", icon: FileText },
  { id: "achievements", title: "Achievements & Certifications", icon: Award },
];

const DEFAULT_SECTIONS: ResumeSection[] = SECTION_META.map((m) => ({
  ...m,
  content: "",
}));

// ─── Utility ──────────────────────────────────────────────────────────────────
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80 ? "#10B981" : score >= 60 ? "#3B82F6" : score >= 40 ? "#F59E0B" : "#E11D48";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
          aria-label={`ATS Score: ${score}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(152,152,190,0.1)"
            strokeWidth="7"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.5s",
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "none" }}
        >
          <span className="text-2xl font-bold font-display" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-slate-400">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold font-display" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({
  onParsed,
  parsing,
  setParsing,
}: {
  onParsed: (sections: ResumeSection[], rawText: string) => void;
  parsing: boolean;
  setParsing: (v: boolean) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      setSuccess("");
      setParsing(true);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok || data.error) {
          setError(data.error ?? "Failed to parse resume.");
          setParsing(false);
          return;
        }

        // Map parsed sections to full section objects with icons
        const parsed: ResumeSection[] = SECTION_META.map((meta) => {
          const found = data.sections?.find(
            (s: { id: string; content: string }) => s.id === meta.id
          );
          return { ...meta, content: found?.content ?? "" };
        });

        onParsed(parsed, data.rawText ?? "");
        setSuccess(`✓ "${file.name}" parsed — ${data.wordCount} words extracted`);
        setTimeout(() => setSuccess(""), 5000);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setParsing(false);
      }
    },
    [onParsed, setParsing]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
          dragOver
            ? "border-azure bg-azure/10 scale-[1.01]"
            : "border-ink-muted hover:border-slate-600 hover:bg-ink-soft/50"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
            e.target.value = "";
          }}
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-azure" size={32} />
            <p className="text-sm text-slate-400">Parsing your resume…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-azure/10 flex items-center justify-center">
              <Upload className="text-azure" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drop your PDF here or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF format • Max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-light text-xs bg-emerald/10 border border-emerald/20 rounded-lg px-3 py-2">
          <CheckCircle size={12} className="flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
}

// ─── LinkedIn Panel ───────────────────────────────────────────────────────────
function LinkedInPanel({
  profile,
  onProfileFetched,
}: {
  profile: LinkedInProfile | null;
  onProfileFetched: (p: LinkedInProfile) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrape = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/scrape-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to fetch LinkedIn data.");
      } else {
        onProfileFetched(data.profile);
        setUrl("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center">
          <Linkedin size={14} className="text-[#0A66C2]" />
        </div>
        <span className="text-sm font-semibold text-white font-display">LinkedIn Sync</span>
        {profile && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald/15 text-emerald-light font-semibold">
            Connected
          </span>
        )}
      </div>

      {!profile ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Paste your LinkedIn URL to compare profile data with your resume and find gaps.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scrape()}
              placeholder="https://linkedin.com/in/your-name"
              className="flex-1 bg-ink-muted/50 border border-ink-muted text-white text-xs rounded-lg px-3 py-2 placeholder:text-slate-600 focus:border-azure transition-colors"
            />
            <button
              onClick={scrape}
              disabled={loading || !url.trim()}
              className="px-3 py-2 bg-[#0A66C2] hover:bg-[#0A66C2]/80 text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Linkedin size={12} />}
              {loading ? "Scraping…" : "Sync"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle size={11} />
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-white">{profile.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{profile.headline}</p>
            </div>
            <button
              onClick={() => onProfileFetched(null as unknown as LinkedInProfile)}
              className="text-slate-600 hover:text-slate-400 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(profile.skills ?? []).slice(0, 6).map((s) => (
              <span
                key={s}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald/10 text-emerald-light border border-emerald/20"
              >
                {s}
              </span>
            ))}
            {(profile.skills ?? []).length > 6 && (
              <span className="text-[10px] text-slate-500">
                +{(profile.skills ?? []).length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Suggestion Card ──────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose/8",
    border: "border-rose/25",
    label: "Critical",
    labelColor: "text-rose-400",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-light",
    bg: "bg-amber/8",
    border: "border-amber/25",
    label: "Warning",
    labelColor: "text-amber-light",
  },
  improvement: {
    icon: TrendingUp,
    color: "text-azure-light",
    bg: "bg-azure/8",
    border: "border-azure/25",
    label: "Improve",
    labelColor: "text-azure-light",
  },
  linkedin_gap: {
    icon: Linkedin,
    color: "text-[#0A66C2]",
    bg: "bg-[#0A66C2]/8",
    border: "border-[#0A66C2]/25",
    label: "LinkedIn Gap",
    labelColor: "text-[#0A66C2]",
  },
  tip: {
    icon: Info,
    color: "text-emerald-light",
    bg: "bg-emerald/8",
    border: "border-emerald/25",
    label: "Tip",
    labelColor: "text-emerald-light",
  },
};

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: AISuggestion;
  onApply: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[suggestion.type] ?? TYPE_CONFIG.tip;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 space-y-2 transition-all duration-200",
        cfg.bg,
        cfg.border,
        suggestion.applied && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <Icon size={13} className={cn("flex-shrink-0 mt-0.5", cfg.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn("text-xs font-semibold", cfg.color)}>{suggestion.message}</p>
            <span
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide",
                cfg.bg,
                cfg.labelColor,
                "border",
                cfg.border
              )}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            <span className="text-slate-300 font-medium">{suggestion.section}:</span>{" "}
            {suggestion.suggestion}
          </p>
        </div>
      </div>
      {!suggestion.applied && (
        <button
          onClick={() => onApply(suggestion.id)}
          className={cn(
            "text-[10px] font-semibold flex items-center gap-1 ml-5 transition-colors",
            cfg.color,
            "hover:opacity-70"
          )}
        >
          <CheckCircle size={10} /> Mark reviewed
        </button>
      )}
      {suggestion.applied && (
        <p className="text-[10px] text-emerald-light ml-5 flex items-center gap-1">
          <CheckCircle size={10} /> Reviewed
        </p>
      )}
    </div>
  );
}

// ─── Section Editor ───────────────────────────────────────────────────────────
function SectionEditor({
  section,
  isActive,
  onChange,
  onToggle,
}: {
  section: ResumeSection;
  isActive: boolean;
  onChange: (id: string, content: string) => void;
  onToggle: (id: string) => void;
}) {
  const Icon = section.icon;
  const hasContent = section.content.trim().length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-200",
        isActive
          ? "border-azure/50 shadow-lg shadow-azure/10"
          : "border-ink-muted hover:border-slate-600"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-ink-soft hover:bg-ink-muted/50 transition-colors"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isActive ? "bg-azure/20" : "bg-ink-muted"
          )}
        >
          <Icon size={14} className={isActive ? "text-azure-light" : "text-slate-400"} />
        </div>
        <span
          className={cn(
            "text-sm font-semibold flex-1 text-left font-display",
            isActive ? "text-azure-light" : "text-white"
          )}
        >
          {section.title}
        </span>
        {hasContent && !isActive && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald/10 text-emerald-light font-medium">
            {section.content.split(/\s+/).length}w
          </span>
        )}
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform text-slate-500",
            isActive && "rotate-90 text-azure-light"
          )}
        />
      </button>

      {isActive && (
        <div className="border-t border-ink-muted">
          <textarea
            value={section.content}
            onChange={(e) => onChange(section.id, e.target.value)}
            rows={9}
            placeholder={`Enter your ${section.title.toLowerCase()}…`}
            className="w-full px-4 py-3 bg-ink text-sm text-white placeholder:text-slate-600 font-mono leading-relaxed resize-none transition-colors"
          />
        </div>
      )}
    </div>
  );
}

// ─── Resume Preview ───────────────────────────────────────────────────────────
function ResumePreview({ sections }: { sections: ResumeSection[] }) {
  const hasContent = sections.some((s) => s.content.trim().length > 0);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <FileText size={40} className="text-slate-600" />
        <p className="text-sm text-slate-400">
          Upload a resume or fill in sections to preview
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        color: "#111",
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px",
        borderRadius: "12px",
        lineHeight: 1.6,
      }}
      className="text-sm"
    >
      {sections
        .filter((s) => s.content.trim().length > 0)
        .map((s) => (
          <div key={s.id} style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#1e40af",
                borderBottom: "2px solid #dbeafe",
                paddingBottom: "4px",
                marginBottom: "8px",
              }}
            >
              {s.title}
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "11.5px",
                color: "#374151",
                margin: 0,
              }}
            >
              {s.content}
            </pre>
          </div>
        ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [sections, setSections] = useState<ResumeSection[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState<string>("summary");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [linkedinProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showJD, setShowJD] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"suggestions" | "gaps" | "wins">("suggestions");

  const handleContentChange = (id: string, content: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
    // Invalidate analysis when content changes
    if (analysis) {
      setAnalysis(null);
      setScanError("");
    }
  };

  const handleParsed = (parsed: ResumeSection[], _rawText: string) => {
    setSections(parsed);
    setAnalysis(null);
    setScanError("");
    // Open first section with content
    const first = parsed.find((s) => s.content.trim().length > 0);
    if (first) setActiveSection(first.id);
  };

  const handleAIScan = async () => {
    setScanning(true);
    setScanError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map(({ id, title, content }) => ({ id, title, content })),
          linkedinProfile,
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setScanError(data.error ?? "AI analysis failed.");
      } else {
        setAnalysis(data.analysis);
        setAppliedIds(new Set());
        setActiveTab("suggestions");
      }
    } catch {
      setScanError("Network error. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleApply = (id: string) => {
    setAppliedIds((prev) => new Set(Array.from(prev).concat(id)));
    if (analysis) {
      setAnalysis({
        ...analysis,
        suggestions: analysis.suggestions.map((s) =>
          s.id === id ? { ...s, applied: true } : s
        ),
      });
    }
  };

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? "" : id));
  };

  const hasResumeContent = sections.some((s) => s.content.trim().length > 0);

  const criticalCount = analysis?.suggestions.filter(
    (s) => s.type === "critical" && !s.applied
  ).length ?? 0;
  const warningCount = analysis?.suggestions.filter(
    (s) => s.type === "warning" && !s.applied
  ).length ?? 0;

  return (
    <div className="min-h-screen bg-ink grid-bg">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 glass-strong border-b border-ink-muted/50 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-azure/15 border border-azure/30 flex items-center justify-center">
              <Sparkles size={16} className="text-azure-light" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-display leading-none">
                ATS Resume Optimizer
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5">
                PDF → LinkedIn → Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex gap-1 bg-ink-soft rounded-lg p-1 border border-ink-muted">
              {(["edit", "preview"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize font-display",
                    view === v
                      ? "bg-azure text-white shadow"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {v === "edit" ? <Edit3 size={11} /> : <Eye size={11} />}
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-ink-soft border border-ink-muted text-slate-300 hover:text-white rounded-lg transition-all hover:border-slate-600">
              <Download size={12} /> Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-57px)]">
        {/* ── Left Sidebar: Upload + LinkedIn + JD ─────────────────────────── */}
        <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-ink-muted/50 p-4 space-y-5">
          {/* Upload */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-display">
              1 · Upload Resume
            </h3>
            <UploadZone onParsed={handleParsed} parsing={parsing} setParsing={setParsing} />
          </div>

          <div className="h-px bg-ink-muted/50" />

          {/* LinkedIn */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-display">
              2 · Sync LinkedIn
            </h3>
            <LinkedInPanel
              profile={linkedinProfile}
              onProfileFetched={(p) => {
                setLinkedInProfile(p);
                setAnalysis(null);
              }}
            />
          </div>

          <div className="h-px bg-ink-muted/50" />

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">
                3 · Target JD (optional)
              </h3>
              <button
                onClick={() => setShowJD(!showJD)}
                className="text-[10px] text-azure-light hover:text-azure transition-colors font-semibold"
              >
                {showJD ? "Hide" : "Add"}
              </button>
            </div>
            {showJD && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Paste a job description for keyword matching.
                </p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here…"
                  rows={5}
                  className="w-full bg-ink-muted/40 border border-ink-muted text-white text-xs rounded-xl px-3 py-2.5 placeholder:text-slate-600 font-mono leading-relaxed resize-none focus:border-azure"
                />
              </div>
            )}
            {!showJD && (
              <p className="text-xs text-slate-600">
                Add a job description for keyword-matched ATS scoring.
              </p>
            )}
          </div>

          <div className="h-px bg-ink-muted/50" />

          {/* Quick Tips */}
          <div className="bg-azure/5 border border-azure/15 rounded-xl p-3.5 space-y-2">
            <h4 className="text-xs font-semibold text-azure-light font-display flex items-center gap-1.5">
              <Zap size={11} /> Best Practices
            </h4>
            {[
              "Use action verbs: Built, Led, Designed",
              "Quantify with numbers and percentages",
              "Match keywords from job descriptions",
              "Include GitHub + LinkedIn links",
              "Keep to 1 page for &lt;5 years experience",
            ].map((tip) => (
              <p
                key={tip}
                className="text-[11px] text-slate-400 flex items-start gap-1.5"
                dangerouslySetInnerHTML={{
                  __html: `<span style="color:#3B82F6;flex-shrink:0">›</span> ${tip}`,
                }}
              />
            ))}
          </div>
        </aside>

        {/* ── Main Editor / Preview ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {view === "edit" ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-white font-display">
                  Resume Sections
                </h2>
                {!hasResumeContent && (
                  <p className="text-xs text-slate-500">Upload a PDF or type below</p>
                )}
              </div>
              {sections.map((section) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  onChange={handleContentChange}
                  onToggle={toggleSection}
                />
              ))}
            </>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-ink-muted">
              <ResumePreview sections={sections} />
            </div>
          )}
        </main>

        {/* ── Right AI Panel ───────────────────────────────────────────────── */}
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-ink-muted/50">
          <div className="p-4 space-y-4 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
            {/* ATS Score */}
            <div className="bg-ink-soft rounded-2xl border border-ink-muted p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  ATS Analysis
                </h3>
                <Sparkles size={13} className="text-azure-light" />
              </div>

              <div className="flex items-center gap-5">
                <ScoreRing score={analysis?.atsScore ?? 0} />
                <div className="flex-1 space-y-2.5 text-xs">
                  {analysis?.scoreBreakdown ? (
                    Object.entries(analysis.scoreBreakdown).map(([key, val]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400 capitalize">{key}</span>
                          <span className="text-white font-semibold">{val}/25</span>
                        </div>
                        <div className="h-1.5 bg-ink-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(val / 25) * 100}%`,
                              background:
                                val >= 20
                                  ? "#10B981"
                                  : val >= 14
                                  ? "#3B82F6"
                                  : val >= 8
                                  ? "#F59E0B"
                                  : "#E11D48",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    [
                      { label: "Keywords", hint: "—" },
                      { label: "Formatting", hint: "—" },
                      { label: "Metrics", hint: "—" },
                      { label: "Completeness", hint: "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-600 font-medium">{item.hint}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {analysis?.overallAssessment && (
                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed border-t border-ink-muted pt-3">
                  {analysis.overallAssessment}
                </p>
              )}
            </div>

            {/* Scan Button */}
            <button
              onClick={handleAIScan}
              disabled={scanning || !hasResumeContent}
              className={cn(
                "w-full py-3.5 flex items-center justify-center gap-2.5 rounded-xl text-sm font-bold font-display transition-all duration-200",
                scanning || !hasResumeContent
                  ? "bg-ink-muted text-slate-500 cursor-not-allowed"
                  : "bg-azure hover:bg-azure-dim text-white shadow-lg shadow-azure/20 hover:shadow-azure/30 glow-azure active:scale-[0.98]"
              )}
            >
              {scanning ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Analyzing with Gemini…
                </>
              ) : (
                <>
                  <Wand2 size={15} />
                  {analysis ? "Re-scan with AI" : "Scan with AI"}
                </>
              )}
            </button>

            {!hasResumeContent && !scanning && (
              <p className="text-[11px] text-slate-500 text-center -mt-2">
                Upload a resume or fill sections first
              </p>
            )}

            {scanError && (
              <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose/8 border border-rose/20 rounded-xl px-3 py-2.5">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Analysis Tabs */}
            {analysis && (
              <>
                {/* Counters */}
                {(criticalCount > 0 || warningCount > 0) && (
                  <div className="flex gap-2">
                    {criticalCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose/10 border border-rose/20 rounded-lg px-2.5 py-1.5">
                        <AlertCircle size={11} />
                        {criticalCount} critical
                      </div>
                    )}
                    {warningCount > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-light bg-amber/10 border border-amber/20 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle size={11} />
                        {warningCount} warnings
                      </div>
                    )}
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-ink-soft rounded-xl p-1 border border-ink-muted">
                  {(
                    [
                      { id: "suggestions", label: "Suggestions", icon: Wand2 },
                      { id: "gaps", label: "Gaps", icon: Target },
                      { id: "wins", label: "Quick Wins", icon: Zap },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold font-display transition-all",
                          activeTab === tab.id
                            ? "bg-azure text-white"
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        <Icon size={10} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                {activeTab === "suggestions" && (
                  <div className="space-y-2">
                    {analysis.suggestions
                      .sort((a, b) => a.priority - b.priority)
                      .map((s) => (
                        <SuggestionCard
                          key={s.id}
                          suggestion={{ ...s, applied: appliedIds.has(s.id) }}
                          onApply={handleApply}
                        />
                      ))}
                    {analysis.suggestions.length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle size={28} className="text-emerald-light mx-auto mb-2" />
                        <p className="text-xs text-slate-400">
                          No issues found — your resume looks great!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "gaps" && (
                  <div className="space-y-4">
                    {analysis.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 font-display">
                          Missing ATS Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[11px] px-2 py-1 rounded-lg bg-rose/10 text-rose-300 border border-rose/20"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.linkedinGaps.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 font-display flex items-center gap-1.5">
                          <Linkedin size={11} className="text-[#0A66C2]" />
                          LinkedIn Gaps
                        </h4>
                        <div className="space-y-2">
                          {analysis.linkedinGaps.map((gap, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-slate-400 bg-[#0A66C2]/5 border border-[#0A66C2]/15 rounded-lg px-3 py-2"
                            >
                              {gap}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.strengthAreas.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide mb-2 font-display">
                          Strengths
                        </h4>
                        <div className="space-y-1.5">
                          {analysis.strengthAreas.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[11px] text-emerald-light"
                            >
                              <CheckCircle size={11} className="flex-shrink-0" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "wins" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Things you can fix in under 5 minutes:
                    </p>
                    {analysis.quickWins.map((win, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 bg-azure/5 border border-azure/15 rounded-xl px-3 py-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-azure/20 text-azure-light text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">{win}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!analysis && !scanning && !scanError && (
              <div className="text-center py-8 space-y-3">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-azure/10 ping-slow" />
                  <div className="relative w-14 h-14 rounded-full bg-azure/15 border border-azure/30 flex items-center justify-center">
                    <Wand2 size={22} className="text-azure-light" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-display">
                    Ready to analyze
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[180px] mx-auto leading-relaxed">
                    Upload resume, optionally sync LinkedIn, then hit Scan with AI
                  </p>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-ink-soft border border-ink-muted rounded-2xl p-4 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display flex items-center gap-1.5">
                <Info size={11} /> How it works
              </h4>
              {[
                { step: "1", text: "Upload PDF → text extracted server-side" },
                { step: "2", text: "LinkedIn scraped via Apify actor" },
                { step: "3", text: "Gemini 1.5 Flash compares & scores" },
                { step: "4", text: "Get prioritized ATS suggestions" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-azure/15 text-azure-light text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </span>
                  <p className="text-[11px] text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
