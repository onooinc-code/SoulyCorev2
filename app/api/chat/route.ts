import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Content } from "@google/genai";
import { Message, Conversation } from '@/lib/types';
import { generateProactiveSuggestion, generateTagsForMessage } from '@/lib/gemini-server';
import { ContextAssemblyPipeline } from '@/core/pipelines/context_assembly';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import llmProvider from '@/core/llm';

// The serverLog function is used in both legacy and V2 paths.
async function serverLog(message: string, payload?: any, level: 'info' | 'warn' | 'error' = 'info') {
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level});
        `;
    } catch (e) {
        console.error("Failed to write log to database:", e);
        console.log(`[${level.toUpperCase()}] ${message}`, payload || '');
    }
}

export async function POST(req: NextRequest) {
    let runId: string | null = null;
    let userMessageId: string | null = null;
    
    try {
        const { messages, conversation, mentionedContacts, userMessageId: receivedUserMessageId }: { messages: Message[], conversation: Conversation, mentionedContacts: any[], userMessageId: string } = await req.json();
        userMessageId = receivedUserMessageId;

        if (!messages || !conversation || !userMessageId) {
            await serverLog('Chat API called with missing data', { conversation }, 'warn');
            return NextResponse.json({ error: 'Missing messages, conversation data, or userMessageId' }, { status: 400 });
        }
        
        // --- V2 Pipeline Logging: Start ---
        const { rows: runRows } = await sql`
            INSERT INTO pipeline_runs (message_id, pipeline_type, status)
            VALUES (${userMessageId}, 'ContextAssembly', 'running')
            RETURNING id;
        `;
        runId = runRows[0].id;
        // --- V2 Pipeline Logging: End ---

        const userMessageContent = messages[messages.length - 1].content;

        // 1. Instantiate Core Services
        const contextPipeline = new ContextAssemblyPipeline();
        
        // 2. Assemble Context using the new pipeline
        const contextString = await contextPipeline.assembleContext({
            conversationId: conversation.id,
            userQuery: userMessageContent,
            mentionedContacts,
            runId: runId!, // Pass runId for step logging
        });
       
        // 3. Prepare message history for the LLM
        const history: Content[] = messages.map((msg: Message) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));
        
        const finalUserPrompt = [contextString, userMessageContent].filter(Boolean).join('\n\n');
        history[history.length-1].parts = [{ text: finalUserPrompt }];
        

        const modelConfig = {
            temperature: conversation.temperature,
            topP: conversation.topP
        };

        const modelOverride = conversation.ui_settings?.model_for_response || conversation.model;

        // 4. Generate AI response
        const responseText = await llmProvider.generateContent(
            history, 
            conversation.systemPrompt || 'You are a helpful AI assistant.',
            modelConfig,
            modelOverride
        );
        
        if (!responseText) {
            throw new Error('Failed to get response from AI.');
        }
        
        // --- V2 Pipeline Logging: Finalize Run ---
        await sql`
            UPDATE pipeline_runs
            SET status = 'completed', final_output = ${contextString}, end_time = CURRENT_TIMESTAMP,
                duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000
            WHERE id = ${runId};
        `;
        // --- V2 Pipeline Logging: End ---

        // 5. Persist the AI's response to episodic memory
        const episodicMemory = new EpisodicMemoryModule();
        const aiMessageData: Omit<Message, 'id' | 'createdAt' | 'conversationId'> = {
            role: 'model',
            content: responseText,
        };
        const savedAiMessage = await episodicMemory.store({ conversationId: conversation.id, message: aiMessageData });
        
        // Fire-and-forget tag generation for both user and AI messages
        (async () => {
            try {
                const userTags = await generateTagsForMessage(userMessageContent);
                if (userTags && userTags.length > 0) {
                    await sql`UPDATE messages SET tags = ${userTags as any} WHERE id = ${userMessageId}`;
                }

                const aiTags = await generateTagsForMessage(responseText);
                if (aiTags && aiTags.length > 0) {
                    await sql`UPDATE messages SET tags = ${aiTags as any} WHERE id = ${savedAiMessage.id}`;
                }
            } catch (tagError) {
                await serverLog('Background tag generation failed', { error: (tagError as Error).message }, 'warn');
            }
        })();

        // 6. Generate proactive suggestion (conditionally)
        let suggestion = null;
        if (conversation.enableProactiveSuggestions) {
            suggestion = await generateProactiveSuggestion(history);
        }

        return NextResponse.json({ response: responseText, suggestion });

    } catch (error) {
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        console.error('Error in chat API:', error);
        await serverLog('Critical error in chat API', { error: errorDetails }, 'error');

        // --- V2 Pipeline Logging: Handle Failure ---
        if (runId) {
             await sql`
                UPDATE pipeline_runs
                SET status = 'failed', error_message = ${errorDetails.message}, end_time = CURRENT_TIMESTAMP,
                    duration_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) * 1000
                WHERE id = ${runId};
            `;
        }
        // --- V2 Pipeline Logging: End ---

        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}