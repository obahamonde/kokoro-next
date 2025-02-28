"use client"
import { useState, useRef } from "react";
import { ChatCompletionMessageParam } from "openai/resources";
import { OpenAI } from "openai";
import { openaiConfig } from "./config.json";

const client = new OpenAI({
    baseURL: openaiConfig.OPENAI_BASE_URL,
    apiKey: openaiConfig.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export default function useChat() {
    const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async (content: string) => {
        setIsLoading(true);
        try {
            // Add user message
            setMessages(prev => [...prev, { role: "user", content }]);

            const response = await client.chat.completions.create({
                model: "deepseek-r1-distill-llama-70b",
                messages: [...messages, { role: "user", content }],
                stream: true
            });

            // Initialize assistant message
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            let assistantMessage = "";
            for await (const chunk of response) {
                const delta = chunk.choices[0]?.delta?.content || "";
                if (delta) {
                    if (delta.includes("<think>")) {
                        setIsThinking(true);
                        assistantMessage += delta;
                    } else if (delta.includes("</think>")) {
                        setIsThinking(false);
                        assistantMessage += delta;
                    } else {
                        assistantMessage += delta;
                        setMessages(prev => {
                            const updatedMessages = [...prev];
                            updatedMessages[updatedMessages.length - 1] = {
                                role: "assistant",
                                content: assistantMessage
                            };
                            return updatedMessages;
                        });
                        scrollToBottom();
                    }
                } console.log(assistantMessage)
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, there was an error processing your request."
            }]);
        } finally {
            setIsLoading(false);

        }
    };

    return { messages, sendMessage, setMessages, isLoading, isThinking, messagesEndRef };
}
