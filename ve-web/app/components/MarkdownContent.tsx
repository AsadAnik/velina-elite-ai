"use client";

import React from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: **bold**, *italic*, `code`, and [links](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Clean up any leaked "(ID 123)" or "[ID: 123]" artifact from LLM
  const cleanedText = text
    .replace(/\s*\((?:ID|id)\s*\d+\)/g, "")
    .replace(/\s*\[(?:ID|id):\s*\d+\]/g, "");

  // Regex matches:
  // 1. **bold**
  // 2. *italic*
  // 3. `inline code`
  // 4. [link](url)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = cleanedText.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // **Bold**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // *Italic*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    // `Inline code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-surface border border-border text-[11px] font-mono text-velina-rose"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // [Link text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-velina-rose font-medium underline underline-offset-2 hover:text-velina-magenta transition-colors"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Plain text
    return <span key={index}>{part}</span>;
  });
}

/**
 * Beautiful, lightweight Markdown Renderer for Velina AI Chat Responses
 */
export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  // Split lines
  const rawLines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "bullet" | "number"; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (!currentList) return;

    if (currentList.type === "bullet") {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-1.5 my-2 pl-0.5">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-velina-rose to-velina-gold mt-1.5 shrink-0" />
              <div className="flex-1">{renderInlineMarkdown(item)}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${key}`} className="space-y-1.5 my-2 pl-0.5">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface border border-border text-[9px] font-bold text-velina-rose mt-0.5 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">{renderInlineMarkdown(item)}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  rawLines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line separates blocks
    if (!trimmed) {
      flushList(index);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList(index);
      elements.push(
        <h4 key={`h3-${index}`} className="text-xs font-bold uppercase tracking-wider text-velina-rose mt-3 mb-1">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(index);
      elements.push(
        <h3 key={`h2-${index}`} className="text-sm font-bold text-foreground mt-3 mb-1.5">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(index);
      elements.push(
        <h2 key={`h1-${index}`} className="text-base font-extrabold text-foreground mt-4 mb-2">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Bullet List Items (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "bullet") {
        flushList(index);
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Numbered List Items (1. or 1))
    const numberMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== "number") {
        flushList(index);
        currentList = { type: "number", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    // Regular paragraph
    flushList(index);
    elements.push(
      <p key={`p-${index}`} className="my-1.5 leading-relaxed">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList(rawLines.length);

  return <div className={`text-xs leading-relaxed space-y-1 ${className}`}>{elements}</div>;
}
