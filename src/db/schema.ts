import { pgTable, text, timestamp, boolean, uuid, customType, jsonb } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[], config: { dimensions: number } }>({
    dataType(config) {
        return `vector(${config?.dimensions ?? 1536})`;
    },
    toDriver(value: number[]) {
        return JSON.stringify(value);
    },
});

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    isPremium: boolean('is_premium').default(false).notNull(),
    memoryEnabled: boolean('memory_enabled').default(false).notNull(),
    normalMessageCount: customType<{ data: number, driverData: number }>({ dataType() { return 'integer' } })('normal_message_count').default(0).notNull(),
    premiumMessageCount: customType<{ data: number, driverData: number }>({ dataType() { return 'integer' } })('premium_message_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().$defaultFn(() => new Date()).notNull(),
});

export const conversations = pgTable('conversations', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$defaultFn(() => new Date()).notNull(),
});

export type MessageSource = {
    title: string;
    url: string;
    sourceId?: string;
};

export type MessageDetails = {
    model: string,
    provider: string,
    promptTokens: number,
    completionTokens: number,
    reasoningTokens: number,
    totalTokens: number,
    cost: number
}

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
        .notNull()
        .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    reasoning: text('reasoning'),
    sources: jsonb('sources').$type<MessageSource[]>(),
    details: jsonb('details').$type<MessageDetails>(),
    createdAt: timestamp('created_at').defaultNow().$defaultFn(() => new Date()).notNull(),
});

export const memoryChunks = pgTable('memory_chunks', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(), // Assuming OpenAI size, change to 768 or other if using different model
    createdAt: timestamp('created_at').defaultNow().$defaultFn(() => new Date()).notNull(),
});
