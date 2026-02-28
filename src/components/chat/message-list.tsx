"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Bot, Code2, Sparkles, Zap, Lightbulb, DatabaseZap, Search, Brain } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage } from "./chat-message";
import { ChatTextArea } from "./chat-text-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { getMessages } from "@/actions/conversations";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";

interface MessageListProps {
    conversationId?: string;
    selectedModelId: string;
    searchEnabled: boolean;
    searchResultCount: number;
    thinkEnabled: boolean;
    reasoningLevel: string;
    memoryEnabled: boolean;
    setSearchEnabled: (v: boolean) => void;
    setSearchResultCount: (v: number) => void;
    setThinkEnabled: (v: boolean) => void;
    setReasoningLevel: (v: string) => void;
    setMemoryEnabled: (v: boolean) => void;
    supportsSearch: boolean;
    supportsThinking: boolean;
}

export function MessageList({
    conversationId,
    selectedModelId,
    searchEnabled,
    searchResultCount,
    thinkEnabled,
    reasoningLevel,
    memoryEnabled,
    setSearchEnabled,
    setSearchResultCount,
    setThinkEnabled,
    setReasoningLevel,
    setMemoryEnabled,
    supportsSearch,
    supportsThinking
}: MessageListProps) {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const activeConversationIdRef = useRef<string | undefined>(conversationId);

    const customFetch = useCallback(async (url: RequestInfo | URL, init?: RequestInit) => {
        const response = await fetch(url, init);

        const newConvId = response.headers.get('x-conversation-id');
        if (newConvId && newConvId !== activeConversationIdRef.current) {
            activeConversationIdRef.current = newConvId;
            window.history.replaceState({}, '', `/chat/${newConvId}`);
        }

        return response;
    }, []);

    const selectedModelIdRef = useRef(selectedModelId);
    selectedModelIdRef.current = selectedModelId;
    const searchEnabledRef = useRef(searchEnabled);
    searchEnabledRef.current = searchEnabled;
    const searchResultCountRef = useRef(searchResultCount);
    searchResultCountRef.current = searchResultCount;
    const thinkEnabledRef = useRef(thinkEnabled);
    thinkEnabledRef.current = thinkEnabled;
    const reasoningLevelRef = useRef(reasoningLevel);
    reasoningLevelRef.current = reasoningLevel;
    const memoryEnabledRef = useRef(memoryEnabled);
    memoryEnabledRef.current = memoryEnabled;

    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
            modelId: selectedModelIdRef.current,
            searchEnabled: searchEnabledRef.current,
            searchResultCount: searchResultCountRef.current,
            thinkEnabled: thinkEnabledRef.current,
            reasoningLevel: reasoningLevelRef.current,
            memoryEnabled: memoryEnabledRef.current,
            conversationId: activeConversationIdRef.current,
        }),
        fetch: customFetch,
    }), [customFetch]);

    const { messages, sendMessage, setMessages, status } = useChat({
        transport,
        onError: (error: Error) => {
            console.error("[MessageList] Stream error:", error);
            setErrorMessage("Something went wrong. Please try again or select a different model.");
        }
    });

    // console.log("messages", messages);

    const isLoading = status === 'submitted' || status === 'streaming';

    useEffect(() => {
        if (!conversationId) return;

        async function loadHistory() {
            const history = await getMessages(conversationId!);
            if (history.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setMessages(history.map((msg: any) => {
                    const parts: any[] = [];
                    if (msg.reasoning) {
                        parts.push({ type: "reasoning", text: msg.reasoning });
                    }
                    if (msg.content) {
                        parts.push({ type: "text", text: msg.content });
                    }
                    if (msg.sources && Array.isArray(msg.sources)) {
                        msg.sources.forEach((s: any) => {
                            parts.push({
                                type: "source-url",
                                url: s.url,
                                title: s.title,
                                sourceId: s.sourceId
                            });
                        });
                    }
                    if (parts.length === 0) {
                        parts.push({ type: "text", text: msg.content || "" });
                    }

                    return {
                        id: msg.id,
                        role: msg.role,
                        content: msg.content || "",
                        parts: parts,
                        createdAt: msg.createdAt,
                    };
                }));
            }
        }
        loadHistory();
    }, [conversationId, setMessages]);

    useEffect(() => {
        if (isLoading) return;
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [messages]);

    const handleSendMessage = (text: string) => {
        setErrorMessage(null);
        sendMessage({ text });
    };

    const handleStarterPromptClick = (prompt: string) => {
        if (isLoading) return;
        sendMessage({ text: prompt });
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4 md:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-24 relative">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center pt-16 md:pt-24 text-center w-full max-w-2xl mx-auto px-4">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 group-hover:blur-2xl transition-all duration-700"></div>
                                <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 shadow-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <Bot size={40} className="text-indigo-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                </div>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight bg-gradient-to-br from-white via-neutral-200 to-neutral-500 text-transparent bg-clip-text">
                                How can I help you today?
                            </h2>
                            <p className="text-neutral-400 mb-12 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                                Select a model, ask a complex question, or choose a prompt below to get started.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                                {[
                                    { icon: <Code2 size={18} className="text-blue-400" />, title: "Code Review", desc: "Analyze this React component for issues", color: "hover:border-blue-500/30 hover:bg-blue-500/5" },
                                    { icon: <Sparkles size={18} className="text-purple-400" />, title: "Brainstorm", desc: "Ideas for a new SaaS application", color: "hover:border-purple-500/30 hover:bg-purple-500/5" },
                                    { icon: <Zap size={18} className="text-amber-400" />, title: "Explain Concept", desc: "How do quantum computers work?", color: "hover:border-amber-500/30 hover:bg-amber-500/5" },
                                    { icon: <Lightbulb size={18} className="text-emerald-400" />, title: "Creative Writing", desc: "Write a short sci-fi story prologue", color: "hover:border-emerald-500/30 hover:bg-emerald-500/5" }
                                ].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleStarterPromptClick(item.desc)}
                                        className={`flex flex-col items-start p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-sm text-left transition-all duration-300 group ${item.color} hover:shadow-lg hover:-translate-y-0.5`}
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 rounded-md bg-neutral-800/80 group-hover:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-medium text-neutral-200">{item.title}</span>
                                        </div>
                                        <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors line-clamp-1">{item.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((ms) => (
                        <ChatMessage key={ms.id} id={ms.id} role={ms.role} parts={ms.parts} />
                    ))}

                    {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex gap-4 flex-row animate-pulse">
                            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-neutral-700 mt-1">
                                <AvatarFallback className="bg-neutral-800 text-white">
                                    <Bot size={16} />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center rounded-2xl px-5 py-3 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-tl-sm">
                                <span className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex-1">
                                <p className="font-medium text-red-200">⚠️ Error</p>
                                <p className="mt-1">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="shrink-0 px-3 py-1 rounded-lg bg-red-900/50 hover:bg-red-900/80 text-red-200 text-xs transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex-none p-4 md:p-6 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent w-full">
                <div
                    className="max-w-3xl mx-auto relative flex flex-col w-full bg-neutral-900 rounded-2xl border border-neutral-700/50 shadow-2xl focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all overflow-hidden"
                >
                    {/* Feature Toggles Bar */}
                    <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 bg-neutral-950/30 border-b border-neutral-800/50 overflow-x-auto scrollbar-none whitespace-nowrap">
                        <label className="flex items-center gap-2 text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors">
                            <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} className="scale-75 data-[state=checked]:bg-indigo-500" />
                            <DatabaseZap size={14} className={memoryEnabled ? "text-indigo-400" : ""} />
                            Vector Memory
                        </label>

                        {supportsSearch && (
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors">
                                    <Switch checked={searchEnabled} onCheckedChange={setSearchEnabled} className="scale-75 data-[state=checked]:bg-sky-500" />
                                    <Search size={14} className={searchEnabled ? "text-sky-400" : ""} />
                                    Web Search
                                </label>
                                {searchEnabled && (
                                    <select
                                        value={searchResultCount}
                                        onChange={(e) => setSearchResultCount(Number(e.target.value))}
                                        className="bg-neutral-900 border border-neutral-700 text-xs rounded-md text-neutral-300 px-1 py-0.5 outline-none focus:border-sky-500"
                                    >
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num} {num === 1 ? 'result' : 'results'}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {supportsThinking && (
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors">
                                    <Switch checked={thinkEnabled} onCheckedChange={setThinkEnabled} className="scale-75 data-[state=checked]:bg-purple-500" />
                                    <Brain size={14} className={thinkEnabled ? "text-purple-400" : ""} />
                                    Reasoning
                                </label>
                                {thinkEnabled && (
                                    <select
                                        value={reasoningLevel}
                                        onChange={(e) => setReasoningLevel(e.target.value)}
                                        className="bg-neutral-900 border border-neutral-700 text-xs rounded-md text-neutral-300 px-1 py-0.5 outline-none focus:border-purple-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    <ChatTextArea onSendMessage={handleSendMessage} isLoading={isLoading} />
                </div>
                <div className="text-center mt-2 text-xs text-neutral-600 font-medium">
                    AI messages may be inaccurate.
                </div>
            </div>
        </div>
    );
}
