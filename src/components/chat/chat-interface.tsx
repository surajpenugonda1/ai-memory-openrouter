"use client";

import { useState, useEffect } from "react";
import { MessageList } from "./message-list";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getOpenRouterModels, type OpenRouterModel } from "@/actions/openrouter";

export function ChatInterface({ conversationId }: { conversationId?: string }) {
    // console.log("conversationId", conversationId);
    const [models, setModels] = useState<OpenRouterModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState("");

    // Feature toggles
    const [searchEnabled, setSearchEnabled] = useState(false);
    const [thinkEnabled, setThinkEnabled] = useState(true);
    const [memoryEnabled, setMemoryEnabled] = useState(true);


    useEffect(() => {
        async function loadModels() {
            const fetchedModels = await getOpenRouterModels();
            // console.log("fetchedModels", fetchedModels);
            setModels(fetchedModels);
            if (fetchedModels.length > 0) {
                // Default to a solid premium model or the first available
                const defaultModel = fetchedModels.find(m => m.id.includes("gpt-4o")) || fetchedModels[0];
                setSelectedModelId(defaultModel.id);
            }
        }
        loadModels();
    }, []);

    // Helper to determine if the selected model realistically supports exact features
    const selectedModel = models.find(m => m.id === selectedModelId);
    const supportsThinking = selectedModel?.id.toLowerCase().includes("deepseek-r1") ||
        selectedModel?.id.toLowerCase().includes("o1") ||
        selectedModel?.id.toLowerCase().includes("o3") || false;

    const supportsSearch = selectedModel?.id.toLowerCase().includes("sonar") ||
        selectedModel?.id.toLowerCase().includes("online") ||
        selectedModel?.id.toLowerCase().includes("perplexity") ||
        selectedModel?.id.toLowerCase().includes("search") || false;
    return (
        <div className="flex flex-col h-full bg-neutral-950 max-h-screen">
            {/* Top Navigation / Model Selector */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm z-10 w-full">
                <div className="flex items-center gap-3">
                    <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                        <SelectTrigger className="w-[300px] bg-neutral-900 border-neutral-700 text-white h-9 shadow-inner shadow-black/20">
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white max-h-[400px]">
                            {models.length === 0 ? (
                                <SelectItem value="loading" disabled>Loading models...</SelectItem>
                            ) : (
                                models.map((m) => (
                                    <SelectItem key={m.id} value={m.id} className="cursor-pointer focus:bg-neutral-800 focus:text-white">
                                        <div className="flex items-center justify-between w-full min-w-[240px]">
                                            <span className="truncate pr-4">{m.name}</span>
                                            {m.isPremium ? (
                                                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px] px-1.5 py-0 h-4 shadow-sm">Premium</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-neutral-700 text-neutral-400 bg-neutral-800 text-[10px] px-1.5 py-0 h-4">Free</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
                {conversationId && (
                    <div className="text-xs text-neutral-500 font-mono">
                        ID: {conversationId.slice(0, 8)}...
                    </div>
                )}
            </div>

            <MessageList
                conversationId={conversationId}
                selectedModelId={selectedModelId}
                searchEnabled={searchEnabled}
                thinkEnabled={thinkEnabled}
                memoryEnabled={memoryEnabled}
                setSearchEnabled={setSearchEnabled}
                setThinkEnabled={setThinkEnabled}
                setMemoryEnabled={setMemoryEnabled}
                supportsSearch={supportsSearch}
                supportsThinking={supportsThinking}
            />
        </div>
    );
}

