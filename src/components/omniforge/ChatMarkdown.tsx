import React from "react";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * A fast, secure, pure-React markdown renderer designed for conversational AI chats.
 * Supports headings, bold/italics, bullet lists, numbered lists, blockquotes, inline code,
 * and fenced code blocks without external dependency bloat.
 */
export function ChatMarkdown({ content, className = "" }: ChatMarkdownProps) {
  if (!content) return null;

  // Split into lines/blocks
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 ml-4 space-y-1 list-disc list-outside text-xs">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 ml-4 space-y-1 list-decimal list-outside text-xs">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <div key={`code-${elements.length}`} className="my-2 rounded-xl bg-surface-muted border border-border overflow-hidden">
          {codeBlockLang && (
            <div className="px-3 py-1 bg-surface border-b border-border/60 text-[10px] uppercase font-mono font-bold text-muted-foreground flex justify-between items-center">
              <span>{codeBlockLang}</span>
            </div>
          )}
          <pre className="p-3 text-[11px] font-mono overflow-x-auto text-foreground leading-relaxed">
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        </div>
      );
      inCodeBlock = false;
      codeBlockLines = [];
      codeBlockLang = "";
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // Check for fenced code block toggle
    if (line.startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeBlockLang = line.replace(/^```/, "").trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Empty line -> paragraph break
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="font-bold text-xs text-foreground mt-3 mb-1 tracking-tight">
          {renderInlineMarkdown(line.substring(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="font-bold text-sm text-foreground mt-3.5 mb-1.5 tracking-tight border-b border-border/40 pb-1">
          {renderInlineMarkdown(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="font-bold text-base text-foreground mt-4 mb-2 tracking-tight">
          {renderInlineMarkdown(line.substring(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={`bq-${i}`} className="my-1.5 pl-3 border-l-2 border-brand/50 text-muted-foreground italic text-xs">
          {renderInlineMarkdown(line.substring(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered list (•, -, *)
    const ulMatch = line.match(/^(\s*)([-*•])\s+(.+)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(renderInlineMarkdown(ulMatch[3]));
      continue;
    }

    // Ordered list (1., 2., etc.)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(renderInlineMarkdown(olMatch[3]));
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-xs">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return <div className={`space-y-2 break-words ${className}`}>{elements}</div>;
}

/**
 * Parses inline markdown: bold, italics, inline code, and links.
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Tokenize regex for **bold**, *italic*, `code`, and [link](url)
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-surface-muted border border-border/80 font-mono text-[11px] text-brand font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline font-medium inline-flex items-center gap-0.5"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Normal text
    return part;
  });
}
