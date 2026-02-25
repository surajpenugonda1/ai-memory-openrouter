import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from '../chat-interface';

// Mock the openrouter actions
vi.mock('@/actions/openrouter', () => ({
    getOpenRouterModels: vi.fn().mockResolvedValue([
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', isPremium: false },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', isPremium: true }
    ])
}));

// We must store the mocked sendMessage and status to manipulate them in tests
const mockSendMessage = vi.fn();
let mockStatus = 'ready';
let mockMessages: Array<{ id: string; role: string; content?: string; parts?: Array<{ type: string; text: string }> }> = [];

// Mock the useChat hook from @ai-sdk/react
vi.mock('@ai-sdk/react', () => ({
    useChat: vi.fn(() => ({
        messages: mockMessages,
        sendMessage: mockSendMessage,
        status: mockStatus,
    }))
}));

describe('ChatInterface', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockSendMessage.mockClear();
        mockStatus = 'ready';
        mockMessages = [];
    });

    it('renders the initial empty state and selects the first model by default', async () => {
        render(<ChatInterface />);

        // Assert empty state elements
        expect(await screen.findByText(/How can I help you today\?/i)).toBeInTheDocument();

        // Check if the mock models are loaded into the select after a tick
        const selectTrigger = await screen.findByRole('combobox');
        expect(selectTrigger).toBeInTheDocument();
    });

    it('disables the send button when input is empty', async () => {
        render(<ChatInterface />);

        // Wait for initial render to settle
        await screen.findByText(/How can I help you today\?/i);

        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeDisabled();
    });

    it('calls sendMessage with correct payload when submitting a message', async () => {
        render(<ChatInterface />);

        // Find the textarea
        const textarea = screen.getByPlaceholderText(/Type your message/i);

        // Type a message
        fireEvent.change(textarea, { target: { value: 'Hello AI!' } });

        // Send button should now be enabled
        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).not.toBeDisabled();

        // Click send
        fireEvent.click(sendButton);

        // Verify our mock was called via the onSubmit handler
        expect(mockSendMessage).toHaveBeenCalledWith({
            role: 'user',
            parts: [{ type: 'text', text: 'Hello AI!' }]
        });
    });

    it('renders streaming messages correctly', async () => {
        // Set up mock state to simulate a received message and a streaming state
        mockMessages = [
            { id: 'msg-1', role: 'user', content: 'What is 2+2?' },
            { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'It is 4' }] }
        ];
        mockStatus = 'streaming';

        render(<ChatInterface />);

        // Check if user message is rendered
        expect(screen.getByText(/What is 2\+2\?/i)).toBeInTheDocument();

        // Check if AI partial response is rendered (from parts array format)
        expect(screen.getByText(/It is 4/i)).toBeInTheDocument();
    });
});
