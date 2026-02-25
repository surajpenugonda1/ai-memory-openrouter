import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
    auth: () => mockAuth()
}));

const mockDbReturning = vi.fn().mockResolvedValue([{ id: 'mock-id' }]);

vi.mock('@/db', () => ({
    db: {
        insert: () => ({
            values: () => ({
                returning: mockDbReturning
            })
        }),
        query: {
            memoryChunks: {
                findMany: vi.fn().mockResolvedValue([])
            },
            users: {
                findFirst: vi.fn().mockResolvedValue({ id: 'test', normalMessageCount: 0, isPremium: false })
            }
        }
    }
}));

// Partially mock AI SDK
vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>();
    return {
        ...actual,
        streamText: vi.fn().mockImplementation(({ onFinish }) => {
            // Simulate stream finishing
            if (onFinish) {
                onFinish({ text: 'Mocked AI streaming response' });
            }
            return {
                toDataStreamResponse: () => new Response('Mock stream response')
            };
        }),
        embed: vi.fn().mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })
    };
});

describe('POST /api/chat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 Unauthorized if user is not authenticated', async () => {
        // Mock no session
        mockAuth.mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [] })
        });

        const res = await POST(req);
        expect(res.status).toBe(401);
        expect(await res.text()).toBe('Unauthorized');
    });

    it('processes generic messages array correctly without throwing 500 when content is nested in parts', async () => {
        // Mock active session
        mockAuth.mockResolvedValue({
            user: { id: 'test-user-id', email: 'test@example.com' }
        });

        const testMessages = [
            {
                role: 'user',
                parts: [{ type: 'text', text: 'Hello API' }]
            }
        ];

        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: testMessages,
                modelId: 'openai/gpt-4o-mini',
                conversationId: 'test-convo-id'
            })
        });

        const res = await POST(req);

        // It should return the mock stream response
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('Mock stream response');
    });
});
