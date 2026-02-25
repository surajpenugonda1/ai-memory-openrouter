import { ChatInterface } from "@/components/chat/chat-interface";

export default async function PastChatPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = await params;
    return <ChatInterface conversationId={conversationId} />;
}
