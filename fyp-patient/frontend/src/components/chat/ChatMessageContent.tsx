"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageContentProps {
  role: "user" | "assistant";
  content: string;
  className?: string;
}

/** Normalize raw model output so markdown renders cleanly. */
function preprocess(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    // Strip em/en dashes that the model uses as decorative separators
    .replace(/\s*[—–]\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/**
 * Splits a single assistant reply into several shorter messages so the chat
 * reads like a real back-and-forth (multiple bubbles) instead of one wall of
 * text. Splits on horizontal rules (`---`) and blank lines, while keeping a
 * short lead-in line (ending with ":") attached to the list that follows it.
 */
export function splitAssistantMessage(raw: string): string[] {
  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\s*[—–]\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    // Turn horizontal-rule lines into hard paragraph breaks
    .replace(/^\s*-{3,}\s*$/gm, "\n\n")
    .replace(/^\s*\*{3,}\s*$/gm, "\n\n");

  const rawSegments = cleaned.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);

  const isList = (s: string) => /^\s*([-*]\s|\d+\.\s)/.test(s);

  const segments: string[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const next = rawSegments[i + 1];
    const isLeadIn = /:\s*$/.test(seg) && seg.length < 90 && !isList(seg);
    if (isLeadIn && next && isList(next)) {
      segments.push(`${seg}\n\n${next}`);
      i++;
    } else {
      segments.push(seg);
    }
  }

  return segments.length > 0 ? segments : [raw.trim()];
}

/**
 * Renders chat message content. Assistant messages are parsed as GitHub-flavored
 * markdown (bold, lists, horizontal rules, links, paragraph breaks); user messages
 * stay as plain text with preserved line breaks.
 */
export function ChatMessageContent({ role, content, className }: ChatMessageContentProps) {
  if (role === "user") {
    return <div className={cn("whitespace-pre-wrap", className)}>{content}</div>;
  }

  return (
    <div className={cn("text-[14px] leading-snug [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 leading-snug">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-0.5 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-0.5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-snug pl-0.5">{children}</li>,
          hr: () => <hr className="my-4 border-border/60" />,
          h1: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2">{children}</h3>,
          h2: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2">{children}</h3>,
          h3: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="font-semibold text-sm mt-3 mb-2">{children}</h4>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/30 pl-3 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono">
              {children}
            </code>
          ),
        }}
      >
        {preprocess(content)}
      </ReactMarkdown>
    </div>
  );
}
