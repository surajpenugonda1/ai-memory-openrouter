"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Brain, Loader2 } from "lucide-react";

interface ThinkAccordionProps {
    content: string;
    isStreaming?: boolean;
}

export function ThinkAccordion({ content, isStreaming = false }: ThinkAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open when streaming reasoning starts
    useEffect(() => {
        if (isStreaming && !isOpen) {
            setIsOpen(true);
        }
    }, [isStreaming, isOpen]);

    return (
        <div className={`my-2 rounded-lg border overflow-hidden transition-colors duration-300 ${isStreaming
                ? "border-purple-500/30 bg-purple-500/5"
                : "border-indigo-500/20 bg-indigo-500/5"
            }`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-3 text-sm font-medium text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isStreaming ? (
                        <Loader2 size={16} className="text-purple-400 animate-spin" />
                    ) : (
                        <Brain size={16} className={isOpen ? "text-indigo-400" : "text-indigo-500/70"} />
                    )}
                    <span>
                        {isStreaming ? (
                            <span className="text-purple-300">Reasoning…</span>
                        ) : (
                            "Thinking Process"
                        )}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={16} className="opacity-70" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="p-4 pt-0 text-sm text-neutral-400 leading-relaxed border-t border-indigo-500/10 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
