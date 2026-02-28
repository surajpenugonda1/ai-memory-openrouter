import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, embed } from 'ai';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { messages, conversations, memoryChunks as memory_chunks, users } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { after } from 'next/server';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

interface ChatMessage {
    role: string;
    content?: string;
    parts?: Array<{ type: string; text?: string }>;
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const {
            messages: chatMessages,
            modelId,
            // searchEnabled and thinkEnabled are received from the client
            // but not yet used. Prefixed with _ to avoid lint warnings.
            searchEnabled: _searchEnabled,
            searchResultCount = 3,
            thinkEnabled: _thinkEnabled,
            reasoningLevel = 'medium',
            memoryEnabled,
            conversationId
        } = await req.json();

        const latestMessage = chatMessages[chatMessages.length - 1];

        const getMessageText = (msg: ChatMessage): string => {
            if (msg.content) return msg.content;
            if (msg.parts) return msg.parts.map((p) => p.text || '').join('');
            return '';
        };

        const latestMessageText = getMessageText(latestMessage);

        console.log('[Chat API] modelId:', modelId, '| memoryEnabled:', memoryEnabled, '| conversationId:', conversationId);
        console.log('[Chat API] latestMessage:', latestMessageText.slice(0, 80));

        const coreMessages = chatMessages.map((msg: ChatMessage) => ({
            role: msg.role,
            content: getMessageText(msg)
        }));

        // 1. Establish or Create Conversation
        let activeConversationId = conversationId;

        if (activeConversationId) {
            // Verify if the conversation actually exists in the DB, some clients generate UUIDs manually
            const existingConv = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.id, activeConversationId)).limit(1);
            if (existingConv.length === 0) {
                const [newConv] = await db.insert(conversations).values({
                    id: activeConversationId,
                    userId,
                    title: latestMessageText.slice(0, 50) + "...",
                }).returning();
                activeConversationId = newConv.id;
            }
        } else {
            const [newConv] = await db.insert(conversations).values({
                userId,
                title: latestMessageText.slice(0, 50) + "...",
            }).returning();
            activeConversationId = newConv.id;
        }

        // 2. Save User Message
        await db.insert(messages).values({
            conversationId: activeConversationId,
            role: 'user',
            content: latestMessageText,
        });

        // 3. Optional Memory Pipeline (pgvector RAG)
        let systemPrompt = "You are a helpful, premium AI assistant. Format your responses with markdown.";

        if (memoryEnabled && latestMessageText.length > 5) {
            try {
                const { embedding } = await embed({
                    model: openrouter.embedding('text-embedding-3-small'),
                    value: latestMessageText,
                });

                const similarity = sql<number>`1 - (${memory_chunks.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

                const similarChunks = await db.select({
                    content: memory_chunks.content,
                    similarity
                })
                    .from(memory_chunks)
                    .where(eq(memory_chunks.userId, userId))
                    .orderBy((t) => desc(t.similarity))
                    .limit(3);

                console.log(`[Memory Pipeline] Retrieved ${similarChunks.length} chunks from vector DB:`);
                similarChunks.forEach((chunk, i) => {
                    const score = typeof chunk.similarity === 'number' ? chunk.similarity.toFixed(4) : chunk.similarity;
                    const passed = typeof chunk.similarity === 'number' && chunk.similarity > 0.2;
                    console.log(`  [Chunk ${i + 1}] Score: ${score} | ${passed ? '✅ PASS' : '❌ BELOW 0.2 threshold'} | Content: "${chunk.content.slice(0, 120)}${chunk.content.length > 120 ? '...' : ''}"`);
                });

                if (similarChunks.length > 0 && similarChunks[0].similarity > 0.2) {
                    const relevantChunks = similarChunks.filter(c => c.similarity > 0.2);
                    const contextText = relevantChunks.map(c => c.content).join("\n\n");
                    systemPrompt += `\n\nRelevant past memories/context:\n${contextText}`;
                }
            } catch (e) {
                console.error("[Memory Pipeline] ❌ Vector retrieval failed, proceeding without memory:", e);
            }
        } else {
            console.log(`[Memory Pipeline] Skipped — memoryEnabled=${memoryEnabled}, messageLength=${latestMessageText.length}`);
        }

        // 4. Stream response from OpenRouter
        const finalMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...coreMessages
        ];

        // Define settings for plugins/reasoning based on input configuration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settings: any = {};

        if (_searchEnabled && searchResultCount) {
            settings.plugins = [
                { id: 'web', max_results: Number(searchResultCount) }
            ];
        }

        if (_thinkEnabled && reasoningLevel) {
            settings.reasoning = {
                effort: reasoningLevel
            };
        }

        // console.log('\n[LLM Request] ═══════════════════════════════════════');
        // console.log('[LLM Request] Model:', modelId || 'openai/gpt-4o-mini');
        // console.log(`[LLM Request] SearchEnabled: ${_searchEnabled}, ThinkingEnabled: ${_thinkEnabled}`);
        // console.log(`[LLM Request] Total messages: ${finalMessages.length}`);
        // finalMessages.forEach((m, i) => {
        //     console.log(`  [${i}] role=${m.role} | ${m.content.length} chars | content="${m.content.slice(0, 150)}${m.content.length > 150 ? '...' : ''}"`);
        // });
        // console.log('[LLM Request] ═══════════════════════════════════════\n');
        const result = streamText({
            model: openrouter.chat(modelId || 'openai/gpt-4o-mini', settings),
            messages: finalMessages,
            async onFinish(data) {
                const { text, response } = data;
                console.log("data", data);
                // Save AI response
                try {
                    // Extract structured parts from the response messages
                    const assistantMessage = response.messages.find(m => m.role === 'assistant');
                    let parts = assistantMessage?.content || [{ type: 'text', text }];
                    let sources: any[] = data.sources || [];
                    let reasoning = "";

                    // Map OpenRouter search plugins sources to `source-url` types
                    if (Array.isArray(parts)) {
                        parts.forEach((part: any) => {
                            if (part.type === 'reasoning') {
                                reasoning = part.text;
                            }
                        });
                    }

                    sources = sources.map((source: any) => {
                        return {
                            type: 'source-url',
                            url: source.url,
                            title: source.title,
                            sourceId: source.sourceId
                        }
                    })

                    console.log("sources", sources);
                    console.log("reasoning", reasoning);

                    await db.insert(messages).values({
                        conversationId: activeConversationId,
                        role: 'assistant',
                        content: text,
                        reasoning: reasoning,
                        sources: sources,
                        details: {
                            model: data.model.modelId,
                            provider: data.model.provider,
                            promptTokens: data.usage.inputTokens,
                            completionTokens: data.usage.outputTokenDetails.textTokens,
                            reasoningTokens: data.usage.reasoningTokens,
                            totalTokens: data.usage.totalTokens,
                            cost: data.usage.raw?.cost || 0
                        },
                    } as any);
                } catch (e) {
                    console.error("Failed to save assistant message to DB:", e);
                }

                // Update Usage Counts (Atomic Increment)
                try {
                    const isPremiumModel = typeof modelId === 'string' &&
                        !modelId.includes('free') &&
                        !modelId.includes('liquid') &&
                        !modelId.includes('arcee') &&
                        !(modelId === 'google/gemma-7b-it:free');

                    if (isPremiumModel) {
                        await db.update(users)
                            .set({ premiumMessageCount: sql`${users.premiumMessageCount} + 1` })
                            .where(eq(users.id, userId));
                    } else {
                        await db.update(users)
                            .set({ normalMessageCount: sql`${users.normalMessageCount} + 1` })
                            .where(eq(users.id, userId));
                    }
                } catch (e) {
                    console.error("Failed to increment usage counts:", e);
                }

                // If Memory is enabled, save this incoming interaction to vector DB for future context
                if (true) {
                    after(async () => {
                        // Start background fact extraction
                        import('ai').then(({ generateText }) => {
                            generateText({
                                model: openrouter.chat('google/gemini-2.5-flash'), // Fast, cheap model
                                system: "You are a memory extraction assistant. Your job is to extract concise, factual, and long-term relevant information from the following conversation turn between a User and an AI. \n\nRULES:\n1. Ignore pleasantries, greetings, and generic conversational filler (e.g., 'Hello', 'Thanks', 'Sure, here is the answer').\n2. Extract core facts about the user (preferences, statements of fact) or the objective knowledge discussed.\n3. Return ONLY the distilled facts. If there is no meaningful information to save, return the exact string 'EMPTY'.",
                                prompt: `User: ${latestMessageText}\n\nAI: ${text}`
                            }).then(async (distilledResponse) => {
                                const distilledText = distilledResponse.text.trim();
                                if (distilledText && distilledText !== 'EMPTY') {
                                    console.log('[Memory Extraction] Saving distilled fact:', distilledText);
                                    try {
                                        const { embedding } = await embed({
                                            model: openrouter.embedding('text-embedding-3-small'),
                                            value: distilledText
                                        });
                                        await db.insert(memory_chunks).values({
                                            userId,
                                            content: distilledText,
                                            embedding: embedding
                                        });
                                    } catch (e) {
                                        console.error("[Memory Extraction] Failed to embed/save fact:", e);
                                    }
                                } else {
                                    console.log('[Memory Extraction] Ignored turn (no core facts extracted).');
                                }
                            }).catch(e => {
                                console.error("[Memory Extraction] LLM extraction failed:", e);
                            });
                        });
                    })
                }
            },
        });

        // 5. Return as UIMessageStream (required for AI SDK v6 useChat)
        return result.toUIMessageStreamResponse({
            headers: { 'x-conversation-id': activeConversationId },
            sendSources: true
        });

    } catch (error: unknown) {
        console.error("Chat API Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(message, { status: 500 });
    }
}
