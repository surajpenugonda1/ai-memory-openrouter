"use client";

import { memo } from "react";
import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageBubble } from "./message-bubble";

interface ChatMessageProps {
    id: string;
    role: string;
    parts: Array<{ type: string;[key: string]: unknown }>;
}

export const ChatMessage = memo(function ChatMessage({ role, parts }: ChatMessageProps) {
    return (
        <div className={`flex gap-3 sm:gap-4 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <Avatar className={`h-8 w-8 shrink-0 ${role === "user" ? "ring-2 ring-indigo-500/30" : "ring-1 ring-neutral-700"} mt-1`}>
                <AvatarFallback className={role === "user" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-white"}>
                    {role === "user" ? <User size={16} /> : <Bot size={16} />}
                </AvatarFallback>
            </Avatar>

            <div
                className={`flex w-auto max-w-[90%] sm:max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 sm:px-5 text-sm ${role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-sm shadow-sm"
                    }`}
            >
                <MessageBubble parts={parts} role={role} />
            </div>
        </div>
    );
});
