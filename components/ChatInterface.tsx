"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  Zap,
  TerminalSquare,
  Activity,
  Clock,
  Paperclip,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { label: "React hooks", icon: "⚛", query: "Explain React hooks in depth" },
  { label: "Next.js App Router", icon: "▲", query: "How does the Next.js App Router work?" },
  { label: "TypeScript generics", icon: "⟨T⟩", query: "Show me advanced TypeScript generics" },
  { label: "API integration", icon: "⇌", query: "Best practices for REST API integration" },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionStart] = useState(new Date());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(false);

    // Generate assistant message ID once
    const assistantMessageId = (Date.now() + 1).toString();
    let hasCreatedMessage = false;

    try {
      const response = await fetch("/chat/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let accumulatedContent = "";
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        // Only create assistant message when we have actual meaningful content
        if (isFirstChunk && accumulatedContent.length > 0 && /\S/.test(accumulatedContent)) {
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: accumulatedContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsStreaming(true);
          isFirstChunk = false;
          hasCreatedMessage = true;
        } else if (hasCreatedMessage) {
          // Update existing assistant message with new content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        }
      }
    } catch {
      // If error occurs after message was created, update it
      if (hasCreatedMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Request failed. Check your connection and retry.",
                }
              : msg
          )
        );
      } else {
        // If error occurs before message was created, create an error message
        const errorMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "Request failed. Check your connection and retry.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatSessionTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - sessionStart.getTime()) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, "0");
    const s = (diff % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap');

        :root {
          --bg-base: #080a0f;
          --bg-surface: #0d1017;
          --bg-raised: #131720;
          --bg-hover: #1a2030;
          --border-subtle: rgba(255,255,255,0.045);
          --border-mid: rgba(255,255,255,0.08);
          --border-strong: rgba(255,255,255,0.13);
          --accent-primary: #3b82f6;
          --accent-glow: rgba(59,130,246,0.18);
          --accent-dim: rgba(59,130,246,0.08);
          --text-primary: #e8ecf2;
          --text-secondary: #7a8599;
          --text-muted: #3d4a5e;
          --text-accent: #60a5fa;
          --success: #22c55e;
          --warn: #f59e0b;
          --font-mono: 'DM Mono', monospace;
          --font-sans: 'Instrument Sans', sans-serif;
          --radius-sm: 4px;
          --radius-md: 8px;
          --radius-lg: 12px;
        }

        .chat-root {
          font-family: var(--font-sans);
          background: var(--bg-base);
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid bg */
        .chat-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        /* Top radial glow */
        .chat-root::after {
          content: '';
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 280px;
          background: radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── HEADER ─────────────────────────────── */
        .chat-header {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(8,10,15,0.92);
          backdrop-filter: blur(20px);
          padding: 0 32px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .agent-mark {
          position: relative;
          width: 34px;
          height: 34px;
        }

        .agent-mark-inner {
          width: 34px;
          height: 34px;
          background: var(--bg-raised);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .agent-mark-inner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), transparent 60%);
        }

        .agent-mark-inner svg {
          color: var(--accent-primary);
          width: 16px;
          height: 16px;
          position: relative;
          z-index: 1;
        }

        .status-pip {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          border: 1.5px solid var(--bg-base);
          box-shadow: 0 0 6px rgba(34,197,94,0.6);
          animation: pip-pulse 2.5s ease-in-out infinite;
        }

        @keyframes pip-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(34,197,94,0.6); }
          50% { opacity: 0.7; box-shadow: 0 0 12px rgba(34,197,94,0.9); }
        }

        .header-title {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          letter-spacing: 0.02em;
        }

        .header-subtitle {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 300;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 1px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .header-badge svg {
          width: 11px;
          height: 11px;
          color: var(--text-muted);
        }

        .header-badge.active svg {
          color: var(--accent-primary);
        }

        .model-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--bg-raised);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          letter-spacing: 0.03em;
        }

        .model-selector:hover {
          background: var(--bg-hover);
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .model-selector svg {
          width: 11px;
          height: 11px;
          color: var(--text-muted);
        }

        /* ── MESSAGES ────────────────────────────── */
        .messages-wrap {
          flex: 1;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .messages-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 40px 32px 24px;
        }

        /* ── EMPTY STATE ─────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          text-align: center;
          gap: 0;
          animation: fade-up 0.5s ease both;
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .empty-icon-wrap {
          position: relative;
          margin-bottom: 28px;
        }

        .empty-icon-ring {
          width: 72px;
          height: 72px;
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          position: relative;
          overflow: hidden;
        }

        .empty-icon-ring::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent-dim) 0%, transparent 60%);
        }

        .empty-icon-ring svg {
          width: 28px;
          height: 28px;
          color: var(--accent-primary);
          position: relative;
          z-index: 1;
        }

        /* Corner ticks */
        .empty-icon-ring::after {
          content: '';
          position: absolute;
          top: 6px; right: 6px;
          width: 6px; height: 6px;
          border-top: 1px solid var(--accent-primary);
          border-right: 1px solid var(--accent-primary);
          opacity: 0.5;
        }

        .empty-label {
          font-size: 11px;
          font-family: var(--font-mono);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-accent);
          margin-bottom: 10px;
        }

        .empty-heading {
          font-size: 26px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin-bottom: 10px;
          line-height: 1.2;
        }

        .empty-sub {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 420px;
          line-height: 1.65;
          margin-bottom: 36px;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          width: 100%;
          max-width: 480px;
        }

        .suggestion-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.15s;
          text-align: left;
        }

        .suggestion-card:hover {
          background: var(--bg-raised);
          border-color: var(--border-strong);
          transform: translateY(-1px);
        }

        .suggestion-icon {
          font-size: 14px;
          width: 28px;
          height: 28px;
          background: var(--bg-hover);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: var(--font-mono);
          color: var(--text-accent);
          font-size: 11px;
        }

        .suggestion-text {
          font-size: 12.5px;
          color: var(--text-secondary);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        /* ── MESSAGE ROWS ────────────────────────── */
        .message-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-row {
          display: flex;
          gap: 12px;
          padding: 4px 0;
          position: relative;
          animation: msg-in 0.25s ease both;
        }

        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .message-row.user {
          flex-direction: row-reverse;
        }

        .avatar-wrap {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .avatar-wrap.assistant {
          background: var(--bg-raised);
          border: 1px solid var(--border-mid);
        }

        .avatar-wrap.user {
          background: rgba(59,130,246,0.12);
          border: 1px solid rgba(59,130,246,0.2);
        }

        .avatar-wrap svg {
          width: 13px;
          height: 13px;
        }

        .avatar-wrap.assistant svg { color: var(--accent-primary); }
        .avatar-wrap.user svg { color: #93c5fd; }

        .message-body {
          flex: 1;
          min-width: 0;
          max-width: 720px;
        }

        .message-row.user .message-body {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .message-row.user .message-meta {
          flex-direction: row-reverse;
        }

        .meta-role {
          color: var(--text-secondary);
          letter-spacing: 0.06em;
        }

        .meta-time { color: var(--text-muted); }

        .message-bubble {
          display: inline-block;
          max-width: 100%;
        }

        /* assistant bubble */
        .bubble-assistant {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 2px var(--radius-lg) var(--radius-lg) var(--radius-lg);
          padding: 14px 18px;
          position: relative;
          overflow: hidden;
        }

        .bubble-assistant::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom, var(--accent-primary), transparent);
          opacity: 0.5;
        }

        /* user bubble */
        .bubble-user {
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.18);
          border-radius: var(--radius-lg) 2px var(--radius-lg) var(--radius-lg);
          padding: 12px 16px;
        }

        .bubble-user p {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.65;
          white-space: pre-wrap;
          margin: 0;
        }

        /* Markdown inside assistant bubble */
        .md-content {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.7;
        }

        .md-content p { margin: 0 0 10px; }
        .md-content p:last-child { margin-bottom: 0; }
        .md-content h1, .md-content h2, .md-content h3 {
          color: var(--text-primary);
          font-weight: 600;
          margin: 16px 0 8px;
          letter-spacing: -0.01em;
        }
        .md-content h1 { font-size: 18px; }
        .md-content h2 { font-size: 16px; }
        .md-content h3 { font-size: 14px; color: var(--text-secondary); }

        .md-content code {
          font-family: var(--font-mono);
          font-size: 12px;
          background: rgba(59,130,246,0.07);
          border: 1px solid rgba(59,130,246,0.15);
          padding: 1px 5px;
          border-radius: 3px;
          color: var(--text-accent);
        }

        .md-content pre {
          background: rgba(0,0,0,0.5) !important;
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-md);
          margin: 12px 0;
          overflow-x: auto;
        }

        .md-content pre code { background: none; border: none; padding: 0; }

        .md-content a { color: var(--text-accent); text-decoration: none; }
        .md-content a:hover { text-decoration: underline; }

        .md-content ul, .md-content ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        .md-content li { margin-bottom: 4px; }

        .md-content blockquote {
          margin: 10px 0;
          padding: 8px 14px;
          border-left: 2px solid var(--accent-primary);
          background: var(--accent-dim);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          color: var(--text-secondary);
          font-style: italic;
        }

        .md-content table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 12px 0;
        }
        .md-content th {
          background: var(--bg-raised);
          border: 1px solid var(--border-mid);
          padding: 7px 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
          text-align: left;
        }
        .md-content td {
          border: 1px solid var(--border-subtle);
          padding: 7px 12px;
          color: var(--text-primary);
        }
        .md-content tr:hover td { background: var(--bg-raised); }

        /* Message actions */
        .message-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .message-row:hover .message-actions,
        .message-row.user:hover .message-actions {
          opacity: 1;
        }

        .message-row.user .message-actions {
          flex-direction: row-reverse;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .action-btn:hover {
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-color: var(--border-mid);
        }

        .action-btn.copied {
          color: var(--success);
          border-color: rgba(34,197,94,0.25);
        }

        .action-btn svg { width: 10px; height: 10px; }

        /* ── LOADING ─────────────────────────────── */
        .loading-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 4px 0;
        }

        .loading-bubble {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 2px var(--radius-lg) var(--radius-lg) var(--radius-lg);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-primary);
          opacity: 0.3;
          animation: dot-blink 1.2s ease infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot-blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.2); }
        }

        .loading-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          animation: label-pulse 1.5s ease-in-out infinite;
        }

        @keyframes label-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* ── INPUT AREA ──────────────────────────── */
        .input-zone {
          position: relative;
          z-index: 10;
          border-top: 1px solid var(--border-subtle);
          background: rgba(8,10,15,0.95);
          backdrop-filter: blur(24px);
          padding: 16px 32px 20px;
          flex-shrink: 0;
        }

        .input-zone-inner {
          max-width: 860px;
          margin: 0 auto;
        }

        .input-container {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border-mid);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .input-container:focus-within {
          border-color: rgba(59,130,246,0.35);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.06), 0 0 20px rgba(59,130,246,0.04);
        }

        /* Top progress line when loading */
        .input-container.loading::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
          animation: progress-scan 1.5s ease-in-out infinite;
          z-index: 2;
        }

        @keyframes progress-scan {
          0% { left: -100%; width: 100%; }
          100% { left: 100%; width: 100%; }
        }

        .input-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.6;
          resize: none;
          padding: 14px 16px 8px;
          min-height: 48px;
          max-height: 128px;
          placeholder-color: var(--text-muted);
        }

        .input-textarea::placeholder {
          color: var(--text-muted);
          font-family: var(--font-sans);
        }

        .input-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px 10px;
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .toolbar-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-muted);
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }

        .toolbar-btn:hover {
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-color: var(--border-subtle);
        }

        .toolbar-btn svg { width: 14px; height: 14px; }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .char-counter {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .char-counter.warn { color: var(--warn); }

        .send-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          background: var(--accent-primary);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
          position: relative;
          overflow: hidden;
        }

        .send-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
        }

        .send-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59,130,246,0.4);
        }

        .send-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          transform: none;
        }

        .send-btn svg { width: 12px; height: 12px; }

        .send-spinner {
          width: 12px;
          height: 12px;
          border: 1.5px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          padding: 0 2px;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 4px rgba(34,197,94,0.5);
        }

        .footer-text {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .footer-hint {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .kbd {
          display: inline-flex;
          align-items: center;
          padding: 1px 4px;
          background: var(--bg-raised);
          border: 1px solid var(--border-mid);
          border-radius: 3px;
          font-size: 9px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          margin: 0 1px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
      `}</style>

      <div className="chat-root">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <div className="agent-mark">
              <div className="agent-mark-inner">
                <TerminalSquare />
              </div>
              <span className="status-pip" />
            </div>
            <div>
              <div className="header-title">C0NTEX</div>
              <div className="header-subtitle">Documentation Intelligence</div>
            </div>
          </div>

          <div className="header-right">
            <div className="header-badge active">
              <Activity />
              <span>Live</span>
            </div>
            <div className="header-badge">
              <Clock />
              <span>{formatSessionTime()}</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="messages-wrap">
          <div className="messages-inner">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <div className="empty-icon-ring">
                    <Bot />
                  </div>
                </div>
                <div className="empty-label">Ready · Agentic Mode</div>
                <h2 className="empty-heading">What can I help you build?</h2>
                <p className="empty-sub">
                  Ask about libraries, frameworks, APIs, or patterns. I access
                  live documentation to give you precise, current answers.
                </p>
                <div className="suggestions-grid">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      className="suggestion-card"
                      onClick={() => setInput(p.query)}
                    >
                      <span className="suggestion-icon">{p.icon}</span>
                      <span className="suggestion-text">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="message-list">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("message-row", message.role)}
                  >
                    <div className={cn("avatar-wrap", message.role)}>
                      {message.role === "user" ? (
                        <User style={{ color: "#93c5fd" }} />
                      ) : (
                        <Bot style={{ color: "var(--accent-primary)" }} />
                      )}
                    </div>

                    <div className="message-body">
                      <div className="message-meta">
                        <span className="meta-role">
                          {message.role === "user" ? "You" : "Agent"}
                        </span>
                        <span className="meta-time">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="message-bubble">
                        {message.role === "assistant" ? (
                          <div className="bubble-assistant">
                            <div className="md-content">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({
                                    inline,
                                    className,
                                    children,
                                    ...props
                                  }: any) {
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className="bubble-user">
                            <p>{message.content}</p>
                          </div>
                        )}
                      </div>

                      <div className="message-actions">
                        <button
                          className={cn(
                            "action-btn",
                            copiedId === message.id && "copied"
                          )}
                          onClick={() =>
                            handleCopy(message.content, message.id)
                          }
                        >
                          {copiedId === message.id ? (
                            <Check />
                          ) : (
                            <Copy />
                          )}
                          <span>
                            {copiedId === message.id ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && !isStreaming && (
                  <div className="loading-row">
                    <div className="avatar-wrap assistant">
                      <Bot style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <div className="loading-bubble">
                      <div className="typing-dots">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                      <span className="loading-label">Processing</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="input-zone">
          <div className="input-zone-inner">
            <form onSubmit={handleSubmit}>
              <div className={cn("input-container", isLoading && "loading")}>
                <textarea
                  ref={inputRef}
                  className="input-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any library, framework, or API..."
                  disabled={isLoading}
                  rows={1}
                />
                <div className="input-toolbar">
                  <div className="toolbar-left">
                    <button type="button" className="toolbar-btn" title="Attach file">
                      <Paperclip />
                    </button>
                    <button type="button" className="toolbar-btn" title="Voice input">
                      <Mic />
                    </button>
                  </div>
                  <div className="toolbar-right">
                    <span
                      className={cn(
                        "char-counter",
                        input.length > 450 && "warn"
                      )}
                    >
                      {input.length}/500
                    </span>
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={!input.trim() || isLoading}
                    >
                      {isLoading ? (
                        <div className="send-spinner" />
                      ) : (
                        <Send />
                      )}
                      <span>{isLoading ? "Sending" : "Send"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="input-footer">
              <div className="footer-left">
                <div className="footer-dot" />
                <span className="footer-text">c0ntex · OpenRouter</span>
              </div>
              <span className="footer-hint">
                <kbd className="kbd">↵</kbd> send ·{" "}
                <kbd className="kbd">⇧↵</kbd> new line
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}