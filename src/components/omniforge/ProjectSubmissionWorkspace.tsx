import React, { useState } from "react";
import {
  Code2,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Send,
  Layers,
  ShieldCheck,
  Check,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import {
  RoadmapNode,
  ProjectSubmission,
  ProjectEvaluationResult,
  SkillDnaEntry,
} from "@/lib/omniforge/user-intelligence";

interface ProjectSubmissionWorkspaceProps {
  node: RoadmapNode;
  skillDna: Record<string, SkillDnaEntry>;
  onSubmitProject: (nodeId: string, submission: ProjectSubmission) => void;
  onAdvanceMilestone?: () => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  isEvaluating?: boolean;
}

export function ProjectSubmissionWorkspace({
  node,
  skillDna,
  onSubmitProject,
  onAdvanceMilestone,
  onToggleSubtask,
  isEvaluating = false,
}: ProjectSubmissionWorkspaceProps) {
  const [submissionTab, setSubmissionTab] = useState<"code" | "github" | "demo" | "doc">("code");
  const [codeContent, setCodeContent] = useState<string>(
    node.submission?.content || ""
  );
  const [githubUrl, setGithubUrl] = useState<string>(
    node.submission?.repositoryUrl || ""
  );
  const [liveUrl, setLiveUrl] = useState<string>(
    node.submission?.liveDemoUrl || ""
  );
  const [notes, setNotes] = useState<string>(node.submission?.notes || "");
  const [localCheckedSubtasks, setLocalCheckedSubtasks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (node.projectTasks) {
      for (const t of node.projectTasks) {
        for (const st of t.subtasks) {
          initial[st.id] = st.completed;
        }
      }
    }
    return initial;
  });

  React.useEffect(() => {
    setCodeContent(node.submission?.content || "");
    setGithubUrl(node.submission?.repositoryUrl || "");
    setLiveUrl(node.submission?.liveDemoUrl || "");
    setNotes(node.submission?.notes || "");
    const initial: Record<string, boolean> = {};
    if (node.projectTasks) {
      for (const t of node.projectTasks) {
        for (const st of t.subtasks) {
          initial[st.id] = st.completed;
        }
      }
    }
    setLocalCheckedSubtasks(initial);
  }, [node.id, node.submission]);

  const evaluation = node.evaluation;
  const isPassed = node.state === "PASSED" || node.state === "COMPLETED";
  const isRevisionRequired = node.state === "REVISION_REQUIRED";
  const isUnderReview = node.state === "UNDER_REVIEW" || isEvaluating;

  // Calculate task checklist progress
  const allSubtasks = node.projectTasks ? node.projectTasks.flatMap((t) => t.subtasks) : [];
  const totalSubtasksCount = allSubtasks.length;
  const checkedCount = allSubtasks.filter(
    (st) => localCheckedSubtasks[st.id] ?? st.completed
  ).length;
  const checklistPercent =
    totalSubtasksCount > 0 ? Math.round((checkedCount / totalSubtasksCount) * 100) : 100;

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    setLocalCheckedSubtasks((prev) => ({
      ...prev,
      [subtaskId]: !prev[subtaskId],
    }));
    if (onToggleSubtask) {
      onToggleSubtask(taskId, subtaskId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission: ProjectSubmission = {
      nodeId: node.id,
      level: node.level,
      submissionType: submissionTab === "github" ? "github" : "code",
      content: codeContent.trim() || (submissionTab === "github" ? `Repository: ${githubUrl}` : "Project deliverable implementation"),
      repositoryUrl: githubUrl.trim() || undefined,
      liveDemoUrl: liveUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    onSubmitProject(node.id, submission);
  };

  const getStarterPlaceholder = (level: number) => {
    switch (level) {
      case 1:
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Developer Profile</title>\n</head>\n<body>\n  <header>\n    <h1>Jane Doe</h1>\n    <nav><ul><li><a href="#about">About</a></li></ul></nav>\n  </header>\n  <main>\n    <section id="about">\n      <h2>Biography</h2>\n      <p>Passionate full stack software engineer.</p>\n    </section>\n    <section id="contact">\n      <h2>Contact Me</h2>\n      <form action="/submit" method="POST">\n        <label for="name">Name:</label>\n        <input id="name" type="text" required>\n        <label for="email">Email:</label>\n        <input id="email" type="email" required>\n        <button type="submit">Send Message</button>\n      </form>\n    </section>\n  </main>\n  <footer><p>&copy; 2026 Jane Doe</p></footer>\n</body>\n</html>`;
      case 4:
        return `// Financial Calculator Logic\nfunction calculateCompoundInterest(principal, rate, years, n = 12) {\n  if (principal <= 0 || rate < 0 || years <= 0) return 0;\n  const r = rate / 100;\n  const amount = principal * Math.pow(1 + r / n, n * years);\n  return Number(amount.toFixed(2));\n}\n\n// DOM Binding\ndocument.getElementById('calc-form').addEventListener('input', (e) => {\n  const p = parseFloat(document.getElementById('principal').value);\n  const r = parseFloat(document.getElementById('rate').value);\n  const y = parseFloat(document.getElementById('years').value);\n  const total = calculateCompoundInterest(p, r, y);\n  document.getElementById('result').textContent = '$' + total.toLocaleString();\n});`;
      case 5:
        return `// Live Weather Analytics Fetcher\nasync function fetchCityWeather(cityName) {\n  const loader = document.getElementById('loader');\n  const errorToast = document.getElementById('error-toast');\n  try {\n    loader.classList.remove('hidden');\n    errorToast.classList.add('hidden');\n    const res = await fetch(\`https://api.example.com/weather?city=\${encodeURIComponent(cityName)}\`);\n    if (!res.ok) throw new Error(\`HTTP \${res.status}: Failed to retrieve weather\`);\n    const data = await res.json();\n    renderWeatherCard(data);\n    localStorage.setItem('last_query', JSON.stringify({ city: cityName, timestamp: Date.now() }));\n  } catch (err) {\n    errorToast.textContent = err.message || 'Network connection failed';\n    errorToast.classList.remove('hidden');\n  } finally {\n    loader.classList.add('hidden');\n  }\n}`;
      default:
        return `// Paste your practical implementation code or component file here...`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/70 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Top Header Card */}
      <div className="p-4 border-b border-border/60 bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              Milestone Level {node.level}
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              {node.miniProject.difficulty} Project
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border text-foreground">
              Skill: {node.skill}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileCode className="w-4 h-4 text-brand" />
            {node.miniProject.title}
          </h2>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          {isPassed ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passed & Verified ({evaluation?.score || 88}/100)
            </span>
          ) : isUnderReview ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              AI Evaluating Evidence...
            </span>
          ) : isRevisionRequired ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Revision Required ({evaluation?.score || 45}/100)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Project Description & Prerequisites */}
        <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Project Overview & Core Concepts
              </span>
              <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                {node.miniProject.description}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold text-muted-foreground">Prerequisites:</span>
            {node.prerequisites && node.prerequisites.length > 0 ? (
              node.prerequisites.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {p} ({skillDna[p]?.proficiency || 80}%)
                </span>
              ))
            ) : (
              <span className="text-muted-foreground italic">None (Foundational stage)</span>
            )}
          </div>
        </div>

        {/* Requirements & Subtask Checklist (Section 15) */}
        {node.projectTasks && node.projectTasks.length > 0 && (
          <div className="p-4 rounded-xl bg-surface border border-border/70 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                  Project Tasks & Subtasks Checklist
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Check off tasks as you build to verify complete requirement coverage.
                </p>
              </div>
              <span className="text-xs font-bold text-brand">
                {checkedCount}/{totalSubtasksCount} Completed ({checklistPercent}%)
              </span>
            </div>

            {/* Checklist progress bar */}
            <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>

            <div className="space-y-3 pt-1">
              {node.projectTasks.map((task) => (
                <div key={task.id} className="space-y-1.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    {task.title}
                  </div>
                  <div className="pl-3 space-y-1.5">
                    {task.subtasks.map((st) => {
                      const isChecked = localCheckedSubtasks[st.id] ?? st.completed;
                      return (
                        <label
                          key={st.id}
                          className="flex items-center gap-2.5 text-[11px] cursor-pointer hover:text-foreground text-muted-foreground transition group select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSubtaskToggle(task.id, st.id)}
                            className="rounded border-border text-brand focus:ring-brand w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={isChecked ? "line-through text-muted-foreground/80" : ""}>
                            {st.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Evaluation Report (Sections 12 & 13) */}
        {evaluation && (
          <div
            className={`p-4 rounded-xl border space-y-3.5 ${
              evaluation.passed
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-amber-500/5 border-amber-500/30"
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    evaluation.passed
                      ? "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md"
                      : "bg-amber-500 text-white shadow-amber-500/20 shadow-md"
                  }`}
                >
                  {evaluation.score}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    AI Project Evaluation Report
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Decision: {evaluation.decision.replace("_", " ")}
                  </span>
                </div>
              </div>

              {evaluation.passed && onAdvanceMilestone && (
                <button
                  onClick={onAdvanceMilestone}
                  className="px-3 py-1.5 rounded-lg bg-gradient-brand text-white text-xs font-bold shadow-brand hover:opacity-95 transition flex items-center gap-1.5"
                >
                  Advance to Next Milestone
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  Verified Strengths
                </span>
                <ul className="text-xs space-y-1 text-foreground">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Requirements / Weaknesses */}
            {evaluation.missingRequirements.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">
                  Missing Requirements & Weaknesses
                </span>
                <ul className="text-xs space-y-1 text-foreground">
                  {evaluation.missingRequirements.map((mis, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{mis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {evaluation.recommendations.length > 0 && (
              <div className="p-2.5 rounded-lg bg-surface/80 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">
                  AI Recommendations for Improvement:
                </span>
                <p>{evaluation.recommendations.join(" ")}</p>
              </div>
            )}
          </div>
        )}

        {/* Project Evidence Submission Form (Section 11) */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-surface border border-border/70 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                Submit Practical Project Evidence
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Provide code snippets, repository URL, or live application links for AI verification.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-0.5 rounded-xl bg-surface-muted/60 border border-border/60">
              <button
                type="button"
                onClick={() => setSubmissionTab("code")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  submissionTab === "code"
                    ? "bg-surface text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground"
                }`}
              >
                Code Snippet
              </button>
              <button
                type="button"
                onClick={() => setSubmissionTab("github")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  submissionTab === "github"
                    ? "bg-surface text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground"
                }`}
              >
                GitHub Repo
              </button>
              <button
                type="button"
                onClick={() => setSubmissionTab("demo")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  submissionTab === "demo"
                    ? "bg-surface text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground"
                }`}
              >
                Live URL
              </button>
            </div>
          </div>

          {/* Submission Mode: Code Editor */}
          {submissionTab === "code" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <label htmlFor="code-input" className="font-semibold">
                  Source Code / Implementation Snippet:
                </label>
                <button
                  type="button"
                  onClick={() => setCodeContent(getStarterPlaceholder(node.level))}
                  className="text-brand hover:underline font-medium"
                >
                  Load Starter Template
                </button>
              </div>
              <textarea
                id="code-input"
                rows={9}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder={getStarterPlaceholder(node.level)}
                className="w-full p-3 font-mono text-xs rounded-xl bg-surface-muted/60 border border-border focus:border-brand focus:ring-1 focus:ring-brand outline-none transition text-foreground resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Submission Mode: GitHub URL */}
          {submissionTab === "github" && (
            <div className="space-y-2">
              <label htmlFor="github-url-input" className="text-xs font-semibold text-foreground block">
                Public GitHub Repository URL:
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  id="github-url-input"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-muted/60 border border-border focus:border-brand outline-none text-foreground"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                OmniForge will inspect repository architecture, commits, and deliverable coverage.
              </p>
            </div>
          )}

          {/* Submission Mode: Live URL */}
          {submissionTab === "demo" && (
            <div className="space-y-2">
              <label htmlFor="live-url-input" className="text-xs font-semibold text-foreground block">
                Deployed Application URL:
              </label>
              <div className="relative">
                <ExternalLink className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  id="live-url-input"
                  type="url"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://my-app.vercel.app"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-muted/60 border border-border focus:border-brand outline-none text-foreground"
                />
              </div>
            </div>
          )}

          {/* Implementation Notes */}
          <div className="space-y-1">
            <label htmlFor="notes-input" className="text-[11px] font-semibold text-muted-foreground block">
              Architectural Notes / Challenges Solved (Optional):
            </label>
            <input
              id="notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Implemented compound interest with edge-case tests for zero principal"
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border focus:border-brand outline-none text-foreground"
            />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground">
              {isPassed
                ? "Milestone completed with verified evidence."
                : "Evaluation will review technical correctness and update your Skill DNA."}
            </span>

            <button
              type="submit"
              disabled={isUnderReview || (!codeContent.trim() && !githubUrl.trim() && !liveUrl.trim())}
              className="px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold shadow-brand hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUnderReview ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Evaluating Project...
                </>
              ) : isPassed ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resubmit for Re-evaluation
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Project for AI Evaluation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
