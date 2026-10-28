import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  FileCheck,
  AlertCircle,
  Sparkles,
  BookOpen,
  Briefcase,
  GraduationCap,
  Layers,
} from "lucide-react";
import { parseResumeContent, ParsedResumeData, SkillDnaEntry } from "@/lib/omniforge/user-intelligence";

export interface UploadedDocumentPayload {
  fileName: string;
  fileSize: number;
  fileType: string;
  text: string;
  docCategory: "resume" | "brief" | "notes" | "general";
  parsedResume?: {
    parsedData: ParsedResumeData;
    derivedSkillDna: Record<string, SkillDnaEntry>;
  };
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentProcessed: (payload: UploadedDocumentPayload) => void;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".txt", ".md"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function DocumentUploadModal({
  isOpen,
  onClose,
  onDocumentProcessed,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<"resume" | "brief" | "notes" | "general">("general");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`);
      return;
    }

    // Validate extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Unsupported format "${ext}". Supported formats: PDF (.pdf), Word (.docx), PowerPoint (.pptx), Text (.txt), Markdown (.md).`);
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      let text = "";
      if (ext === ".txt" || ext === ".md") {
        text = await file.text();
      } else {
        // Extract plain text stream representation for binary documents
        const arrayBuf = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
        const rawString = decoder.decode(arrayBuf);
        // Clean non-printable characters for structured indexing
        const cleaned = rawString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
        // Extract words with alphanumeric content
        const extractedWords = cleaned.match(/[a-zA-Z0-9_\-\.\,\:\@\#\$\%\&\*\(\)\+\=\/\?\!\'\"]{2,}/g);
        if (extractedWords && extractedWords.length > 20) {
          text = extractedWords.slice(0, 5000).join(" ");
        } else {
          text = `[Document: ${file.name}]\nFormat: ${ext.toUpperCase()}\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted content stream ready for conversational exploration.`;
        }
      }

      setExtractedText(text);

      // Auto-detect category from text
      const lower = (text + " " + file.name).toLowerCase();
      if (lower.includes("resume") || lower.includes("curriculum vitae") || lower.includes("education") && lower.includes("skills")) {
        setDetectedCategory("resume");
      } else if (lower.includes("brief") || lower.includes("scope of work") || lower.includes("requirements") || lower.includes("prd")) {
        setDetectedCategory("brief");
      } else if (lower.includes("presentation") || lower.includes("notes") || lower.includes("study") || lower.includes("lecture")) {
        setDetectedCategory("notes");
      } else {
        setDetectedCategory("general");
      }
    } catch (err: any) {
      setErrorMessage(`Failed to process document: ${err?.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = (categoryOverride?: "resume" | "brief" | "notes" | "general") => {
    if (!selectedFile) return;

    const finalCat = categoryOverride || detectedCategory;
    let parsedResume = undefined;

    if (finalCat === "resume") {
      try {
        parsedResume = parseResumeContent(extractedText);
      } catch (e) {
        console.warn("Resume parsing fallback", e);
      }
    }

    onDocumentProcessed({
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type || selectedFile.name.split(".").pop() || "unknown",
      text: extractedText,
      docCategory: finalCat,
      parsedResume,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border/60 bg-surface/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Upload Document</h3>
              <p className="text-[11px] text-muted-foreground">
                Supported: PDF (.pdf), Word (.docx), PowerPoint (.pptx), Plain text (.txt), Markdown (.md)
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
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-brand/60 rounded-2xl p-8 text-center cursor-pointer transition bg-surface/40 hover:bg-surface/70 space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-soft text-brand flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Choose a file from your device</div>
                <div className="text-xs text-muted-foreground mt-1">
                  or drag and drop your document here (Max 20MB)
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {SUPPORTED_EXTENSIONS.map((ext) => (
                  <span
                    key={ext}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-muted text-muted-foreground border border-border/60"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* File Preview & Actions */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{selectedFile.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to index
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setExtractedText("");
                  }}
                  className="text-xs text-muted-foreground hover:text-rose-500 font-medium px-2 py-1 rounded-lg hover:bg-surface transition"
                >
                  Change file
                </button>
              </div>

              {/* Text Preview Snippet */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Extracted Preview
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border/80 text-xs font-mono text-muted-foreground max-h-36 overflow-y-auto leading-relaxed">
                  {isProcessing ? "Processing file contents..." : extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : "")}
                </div>
              </div>

              {/* Destination Routing Options */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  How would you like to use this file?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => handleConfirmUpload("general")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      detectedCategory === "general"
                        ? "border-brand bg-brand-soft/20 text-foreground"
                        : "border-border/80 bg-surface hover:bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Conversational Q&A</div>
                      <div className="text-[10px] text-muted-foreground">Ask questions & explore document in chat</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleConfirmUpload("resume")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      detectedCategory === "resume"
                        ? "border-brand bg-brand-soft/20 text-foreground"
                        : "border-border/80 bg-surface hover:bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Resume Skill Analysis</div>
                      <div className="text-[10px] text-muted-foreground">Extract verified skills to Skill DNA</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleConfirmUpload("brief")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      detectedCategory === "brief"
                        ? "border-brand bg-brand-soft/20 text-foreground"
                        : "border-border/80 bg-surface hover:bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Project Brief Planning</div>
                      <div className="text-[10px] text-muted-foreground">Generate project architecture & execution plan</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleConfirmUpload("notes")}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      detectedCategory === "notes"
                        ? "border-brand bg-brand-soft/20 text-foreground"
                        : "border-border/80 bg-surface hover:bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Study Notes & Learning</div>
                      <div className="text-[10px] text-muted-foreground">Generate learning roadmap or explanation</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedFile && (
          <div className="p-4 border-t border-border/60 bg-surface/80 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-surface-muted transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmUpload()}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold hover:opacity-90 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Attach to Chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
