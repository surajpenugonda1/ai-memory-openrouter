"use client";

import { ExternalLink, Globe } from "lucide-react";
import { ThinkAccordion } from "./think-accordion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { memo } from 'react';

// ── Types matching AI SDK v6 UIMessage parts ────────────

interface StepStartPart {
    type: 'step-start';
}

interface ReasoningPart {
    type: 'reasoning';
    text: string;
    providerMetadata?: Record<string, unknown>;
    state: 'streaming' | 'done';
}

interface TextPart {
    type: 'text';
    text: string;
    providerMetadata?: unknown;
    state: 'streaming' | 'done';
}

interface SourceUrlPart {
    type: 'source-url';
    url: string;
    title?: string;
    providerMetadata?: unknown;
}

type MessagePart = StepStartPart | ReasoningPart | TextPart | SourceUrlPart | { type: string;[key: string]: unknown };

// ── Markdown renderer ───────────────────────────────────

const MarkdownBlock = ({ content }: { content: string }) => (
    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 text-sm">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props: React.ComponentPropsWithoutRef<'code'>) {
                    const { className, children, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                        <SyntaxHighlighter
                            style={vscDarkPlus as Record<string, React.CSSProperties>}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md my-4 text-sm"
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code {...rest} className={`${className || ''} bg-neutral-800/50 px-1.5 py-0.5 rounded-md text-xs font-mono text-indigo-300`}>
                            {children}
                        </code>
                    );
                }
            }}
        >
            {content}
        </ReactMarkdown>
    </div>
);

// ── Source card for search results ───────────────────────

function SourceCard({ url, title }: { url: string; title?: string }) {
    let hostname = '';
    try {
        hostname = new URL(url).hostname.replace('www.', '');
    } catch {
        hostname = url;
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700/50 bg-neutral-800/40 hover:bg-neutral-800/70 hover:border-neutral-600 transition-all group text-xs min-w-0"
        >
            <Globe size={14} className="text-neutral-500 group-hover:text-sky-400 shrink-0 transition-colors" />
            <div className="min-w-0 flex-1">
                {title && (
                    <div className="text-neutral-300 truncate font-medium group-hover:text-white transition-colors">
                        {title}
                    </div>
                )}
                <div className="text-neutral-500 truncate">{hostname}</div>
            </div>
            <ExternalLink size={12} className="text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-colors" />
        </a>
    );
}

// ── Main component ──────────────────────────────────────

interface MessageBubbleProps {
    parts: MessagePart[];
    role: 'user' | 'assistant' | string;
}

export const MessageBubble = memo(function MessageBubble({ parts, role }: MessageBubbleProps) {
    // console.log(parts)
    // For user messages, just render text
    if (role === 'user') {
        const text = parts
            .filter((p): p is TextPart => p.type === 'text')
            .map(p => p.text)
            .join('');
        return <span>{text}</span>;
    }

    // For assistant messages, categorize parts
    const reasoningParts = parts.filter((p): p is ReasoningPart => p.type === 'reasoning');
    const textParts = parts.filter((p): p is TextPart => p.type === 'text');
    const sourceParts = parts.filter((p): p is SourceUrlPart => p.type === 'source-url');

    const reasoningText = reasoningParts.map(p => p.text).join('');
    const mainText = textParts.map(p => p.text).join('');
    const isReasoningStreaming = reasoningParts.some(p => p.state === 'streaming');

    return (
        <div className="space-y-2">
            {/* 1. Reasoning section (collapsible) */}
            {reasoningText.length > 0 && (
                <ThinkAccordion
                    content={reasoningText}
                    isStreaming={isReasoningStreaming}
                />
            )}


            {/* 2. Source URLs section */}
            {sourceParts.length > 0 && (
                <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                        Sources
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {sourceParts.map((source, i) => (
                            <SourceCard key={i} url={source.url} title={source.title} />
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Main text section */}
            {mainText.length > 0 && (
                <MarkdownBlock content={mainText} />
            )}
        </div>
    );
});
