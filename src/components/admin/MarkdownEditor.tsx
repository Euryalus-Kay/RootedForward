"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Eye,
  PenLine,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

interface ToolbarAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const toolbarActions: ToolbarAction[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "*", suffix: "*" },
  { icon: Heading2, label: "Heading", prefix: "## ", suffix: "", block: true },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
  { icon: List, label: "Bullet List", prefix: "- ", suffix: "", block: true },
  {
    icon: ListOrdered,
    label: "Numbered List",
    prefix: "1. ",
    suffix: "",
    block: true,
  },
  { icon: Quote, label: "Quote", prefix: "> ", suffix: "", block: true },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
];

function renderMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings (must come before other inline processing)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="border-l-4 border-forest/30 pl-4 italic text-ink-light">$1</blockquote>'
  );

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="rounded bg-cream-dark px-1.5 py-0.5 text-sm font-mono text-rust">$1</code>');

  // Links
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-rust underline hover:text-rust-light" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Process lists
  const lines = html.split("\n");
  const processed: string[] = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ulMatch = line.match(/^- (.+)$/);
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (!inUl) {
        if (inOl) {
          processed.push("</ol>");
          inOl = false;
        }
        processed.push('<ul class="list-disc pl-6 space-y-1">');
        inUl = true;
      }
      processed.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (!inOl) {
        if (inUl) {
          processed.push("</ul>");
          inUl = false;
        }
        processed.push('<ol class="list-decimal pl-6 space-y-1">');
        inOl = true;
      }
      processed.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) {
        processed.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        processed.push("</ol>");
        inOl = false;
      }
      // Wrap non-empty, non-tag lines in paragraphs
      if (line.trim() && !line.startsWith("<h") && !line.startsWith("<blockquote")) {
        processed.push(`<p>${line}</p>`);
      } else if (line.trim()) {
        processed.push(line);
      } else {
        processed.push("<br />");
      }
    }
  }

  if (inUl) processed.push("</ul>");
  if (inOl) processed.push("</ol>");

  return processed.join("\n");
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineNumbers = useMemo(() => {
    const count = value.split("\n").length;
    return Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1);
  }, [value]);

  const charCount = value.length;

  const renderedHtml = useMemo(() => {
    if (mode !== "preview") return "";
    return renderMarkdownToHtml(value);
  }, [value, mode]);

  const applyAction = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let newText: string;
      let newCursorStart: number;
      let newCursorEnd: number;

      if (action.block) {
        // Block-level: apply prefix at line start
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const beforeLine = value.substring(0, lineStart);
        const afterCursor = value.substring(end);
        const currentLineText = selectedText || value.substring(lineStart, end);

        if (selectedText && selectedText.includes("\n")) {
          // Multi-line selection: apply prefix to each line
          const lines = selectedText.split("\n");
          const prefixedLines = lines.map((line, i) => {
            if (action.label === "Numbered List") {
              return `${i + 1}. ${line}`;
            }
            return `${action.prefix}${line}`;
          });
          const joined = prefixedLines.join("\n");
          newText = value.substring(0, start) + joined + afterCursor;
          newCursorStart = start;
          newCursorEnd = start + joined.length;
        } else {
          newText =
            beforeLine +
            action.prefix +
            currentLineText +
            action.suffix +
            afterCursor;
          newCursorStart = lineStart + action.prefix.length;
          newCursorEnd =
            lineStart + action.prefix.length + currentLineText.length;
        }
      } else {
        // Inline: wrap selected text
        const before = value.substring(0, start);
        const after = value.substring(end);
        const wrapped = action.prefix + (selectedText || action.label.toLowerCase()) + action.suffix;
        newText = before + wrapped + after;

        if (selectedText) {
          newCursorStart = start + action.prefix.length;
          newCursorEnd = start + action.prefix.length + selectedText.length;
        } else {
          newCursorStart = start + action.prefix.length;
          newCursorEnd =
            start + action.prefix.length + action.label.toLowerCase().length;
        }
      }

      onChange(newText);

      // Restore selection after React re-renders
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
      });
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = value.substring(0, start);
        const after = value.substring(end);

        onChange(before + "  " + after);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
        });
      }
    },
    [value, onChange]
  );

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-cream-dark/50 px-3 py-2">
        <div className="flex items-center gap-0.5">
          {toolbarActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => applyAction(action)}
                disabled={mode === "preview"}
                title={action.label}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  mode === "preview"
                    ? "cursor-not-allowed text-warm-gray-light"
                    : "text-ink-light hover:bg-cream-dark hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center rounded-md border border-border bg-cream">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "flex items-center gap-1.5 rounded-l-md px-3 py-1 text-xs font-medium transition-colors",
              mode === "write"
                ? "bg-forest text-cream"
                : "text-ink-light hover:text-ink"
            )}
          >
            <PenLine className="h-3.5 w-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-r-md px-3 py-1 text-xs font-medium transition-colors",
              mode === "preview"
                ? "bg-forest text-cream"
                : "text-ink-light hover:text-ink"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview area */}
      {mode === "write" ? (
        <div className="flex">
          {/* Line numbers */}
          <div className="select-none border-r border-border bg-cream-dark/30 px-3 py-3 text-right">
            {lineNumbers.map((num) => (
              <div
                key={num}
                className="font-mono text-xs leading-6 text-warm-gray-light"
              >
                {num}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[200px] flex-1 resize-y bg-white px-4 py-3 font-mono text-sm leading-6 text-ink placeholder:text-warm-gray-light focus:outline-none"
            spellCheck
          />
        </div>
      ) : (
        <div className="min-h-[200px] bg-white px-6 py-4">
          {value.trim() ? (
            <div
              className="prose prose-sm max-w-none space-y-2 text-ink [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-forest [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-forest [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-forest [&_strong]:font-semibold [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <p className="text-sm italic text-warm-gray">
              Nothing to preview. Start writing in the editor.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-cream-dark/30 px-4 py-1.5">
        <p className="text-xs text-warm-gray">Markdown supported</p>
        <p className="text-xs text-warm-gray">
          {charCount.toLocaleString()} character{charCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
