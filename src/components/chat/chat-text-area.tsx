"use client";

import { useState } from "react";
import { Send, ImageIcon, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatTextAreaProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

export function ChatTextArea({ onSendMessage, isLoading }: ChatTextAreaProps) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input?.trim() || isLoading) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <>
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[60px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-neutral-500 py-4 px-4 pr-12 scrollbar-thin"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as unknown as React.FormEvent);
                    }
                }}
            />
            <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <ImageIcon size={16} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <FileIcon size={16} />
                    </Button>
                </div>
                <Button
                    type="submit"
                    size="icon"
                    disabled={!input?.trim() || isLoading}
                    className="h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-800 disabled:text-neutral-600 transition-colors"
                    onClick={handleSubmit}
                >
                    <Send size={14} className={input?.trim() && !isLoading ? "translate-x-[-1px] translate-y-[1px]" : ""} />
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </>
    );
}
