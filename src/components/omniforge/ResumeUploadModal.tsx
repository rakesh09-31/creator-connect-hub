import React, { useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Code2,
  Briefcase,
} from "lucide-react";
import {
  parseResumeContent,
  ParsedResumeData,
  SkillDnaEntry,
} from "@/lib/omniforge/user-intelligence";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: {
    parsedData: ParsedResumeData;
    derivedSkillDna: Record<string, SkillDnaEntry>;
  }) => void;
}

export function ResumeUploadModal({
  isOpen,
  onClose,
  onApplyParsedData,
}: ResumeUploadModalProps) {
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    parsedData: ParsedResumeData;
    derivedSkillDna: Record<string, SkillDnaEntry>;
  } | null>(null);

  if (!isOpen) return null;

  const handleSampleResume = () => {
    const sample = `John Doe
B.Tech in Computer Science & Engineering (4th Year, Expected 2026)
Skills: Python, FastAPI, JavaScript, TypeScript, React, HTML5, CSS3, Tailwind CSS, PostgreSQL, SQL, Git, Docker
Experience:
- Software Engineering Intern at OmniCraft Labs (6 months): Built responsive frontend features with React, created REST APIs in Python/FastAPI, managed PostgreSQL schemas.
Projects:
- Personal Task Platform: Full stack project using React, TypeScript, and PostgreSQL with JWT auth.
- Python Automation & Scraping: Built 5 backend scripts with automated report generation.`;
    setResumeText(sample);
  };

  const handleAnalyze = () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = parseResumeContent(resumeText);
      setParsedPreview(result);
      setIsAnalyzing(false);
    }, 400);
  };

  const handleConfirm = () => {
    if (parsedPreview) {
      onApplyParsedData(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border/60 bg-surface/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">AI Resume Competency Analysis</h3>
              <p className="text-[11px] text-muted-foreground">
                Extract verified skills, education, and experience to generate your Skill DNA.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!parsedPreview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Paste resume text or profile summary:</span>
                <button
                  type="button"
                  onClick={handleSampleResume}
                  className="text-brand font-semibold text-[11px] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Sample Student Resume
                </button>
              </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste education, skills, projects, and work experience here..."
                rows={8}
                className="w-full p-3 rounded-xl bg-surface-muted/50 border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              />

              <div className="p-3 rounded-xl bg-surface-muted/30 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">What OmniForge extracts:</div>
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <span>✓ Degree & Graduation Year</span>
                  <span>✓ Programming Languages</span>
                  <span>✓ Frontend & Backend Frameworks</span>
                  <span>✓ Databases & Cloud Tools</span>
                  <span>✓ Work & Internship Evidence</span>
                  <span>✓ Verifiable Skill DNA</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Resume successfully analyzed! Review extracted competencies below:</span>
              </div>

              {/* Education */}
              <div className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Education
                </span>
                <div className="text-xs font-bold text-foreground">
                  {parsedPreview.parsedData.education.degree} — {parsedPreview.parsedData.education.branch}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Status: {parsedPreview.parsedData.education.graduationStatus} ({parsedPreview.parsedData.education.currentYear})
                </div>
              </div>

              {/* Extracted Skills */}
              <div className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Code2 className="w-3 h-3" />
                  Technical Stack Detected
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedPreview.parsedData.technicalSkills.languages.map((l, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                      {l}
                    </span>
                  ))}
                  {parsedPreview.parsedData.technicalSkills.frameworks.map((f, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border text-brand">
                      {f}
                    </span>
                  ))}
                  {parsedPreview.parsedData.technicalSkills.databases.map((d, i) => (
                    <span key={i} className="text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill DNA Preview */}
              <div className="p-3 rounded-xl bg-surface border border-border/70 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand" />
                  Updated Skill DNA Scores
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.values(parsedPreview.derivedSkillDna).slice(0, 6).map((item) => (
                    <div key={item.skillName} className="p-2 rounded bg-surface-muted/30 border border-border/40 flex items-center justify-between">
                      <span className="font-semibold">{item.skillName}</span>
                      <span className="font-bold text-brand">{item.proficiency}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-surface/80 flex items-center justify-end gap-2">
          {!parsedPreview ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-medium text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!resumeText.trim() || isAnalyzing}
                className="px-4 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-brand hover:opacity-95 transition disabled:opacity-50"
              >
                {isAnalyzing ? "Extracting Competencies..." : "Analyze & Extract DNA"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setParsedPreview(null)}
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-medium text-muted-foreground"
              >
                Edit Text
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-brand hover:opacity-95 transition"
              >
                Update Skill DNA & Roadmap
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
