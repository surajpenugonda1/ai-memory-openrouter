"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

export async function getConversations() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return [];
        }

        const data = await db
            .select({
                id: conversations.id,
                title: conversations.title,
                updatedAt: conversations.updatedAt,
            })
            .from(conversations)
            .where(eq(conversations.userId, session.user.id))
            .orderBy(desc(conversations.updatedAt))
            .limit(50);

        return data;
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export async function getMessages(conversationId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Verify the conversation belongs to this user
        const conv = await db
            .select({ id: conversations.id })
            .from(conversations)
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.userId, session.user.id)
                )
            )
            .limit(1);

        if (conv.length === 0) return [];

        const data = await db
            .select({
                id: messages.id,
                role: messages.role,
                content: messages.content,
                reasoning: messages.reasoning,
                sources: messages.sources,
                createdAt: messages.createdAt,
            })
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(asc(messages.createdAt));

        return data;
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
}
