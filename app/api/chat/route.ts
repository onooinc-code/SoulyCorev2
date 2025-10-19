import { NextRequest, NextResponse } from 'next/server';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { generateProactiveSuggestion } from '@/lib/gemini-server';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { Message, Conversation, Contact } from '@/lib/types';
import { Content } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { messages, conversation, mentionedContacts, userMessageId } = (await req.json()) as {
            messages: Message[],
            conversation: Conversation,
            mentionedContacts: Contact[],
            userMessageId: string
        };

        if (!messages || !conversation) {
            return NextResponse.json({ error: 'Missing messages or conversation data' }, { status: 400 });
        }

        const latestUserMessageContent = messages[messages.length - 1]?.content || '';
        
        // V2 Core Engine: Use the Context Assembly Pipeline
        const contextPipeline = new ContextAssemblyPipeline();
        const assembledContext = await contextPipeline.run({
            // FIX: Changed conversationId to conversation to match the ContextAssemblyInput interface.
            conversation: conversation,
            userQuery: latestUserMessageContent,
            config: {
                episodicMemoryDepth: 10,
                semanticMemoryTopK: 3
            },
            mentionedContacts,
            userMessageId,
        });

        const aiResponseText = assembledContext.llmResponse;

        // Save the AI response to episodic memory
        const aiMessage: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'model',
            content: aiResponseText,
            tokenCount: Math.ceil(aiResponseText.length / 4),
            responseTime: assembledContext.llmResponseTime,
        };
        const episodicMemory = new EpisodicMemoryModule();
        await episodicMemory.store({
            conversationId: conversation.id,
            message: aiMessage
        });
        
        let suggestion = null;
        if (conversation.enableProactiveSuggestions) {
            const historyForSuggestion : Content[] = (await episodicMemory.query({ conversationId: conversation.id, limit: 4 }))
                .map(m => ({ role: m.role, parts: [{ text: m.content }] }));
            suggestion = await generateProactiveSuggestion(historyForSuggestion);
        }

        return NextResponse.json({ response: aiResponseText, suggestion });

    } catch (error) {
        console.error('Error in chat API:', error);
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}