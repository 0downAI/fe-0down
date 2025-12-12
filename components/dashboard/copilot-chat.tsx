"use client";

import { useEffect, useState } from "react";
import { TextLoop } from "@/components/ui/text-loop";
import { Chat } from "@/components/ui/chat";
import { Message } from "@/components/ui/chat-message";
import { createClient } from "@/lib/supabase";
import api from "@/lib/api";

export function CopilotChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState("");

    useEffect(() => {
        let currentSession = localStorage.getItem("chat_session_id");
        if (!currentSession) {
            currentSession = "sess_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("chat_session_id", currentSession);
        }
        setSessionId(currentSession);
        fetchChatHistory(currentSession);
    }, []);

    const fetchChatHistory = async (sessId: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from("chat_logs")
            .select("*")
            .eq("session_id", sessId)
            .order("timestamp", { ascending: true });

        if (data) {
            const formattedMessages: Message[] = [];
            data.forEach((log: any) => {
                formattedMessages.push({
                    id: `u-${log.id}`,
                    role: "user",
                    content: log.user_query,
                    createdAt: new Date(log.timestamp),
                });
                formattedMessages.push({
                    id: `b-${log.id}`,
                    role: "assistant",
                    content: log.bot_response,
                    createdAt: new Date(log.timestamp),
                });
            });
            setMessages(formattedMessages);
        }
    };

    const handleSubmit = async (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const { data } = await api.post("/chat", {
                message: userMsg.content,
                session_id: sessionId,
            });

            if (data.status === "success") {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.response,
                    createdAt: new Date(),
                };
                setMessages((prev) => [...prev, botMsg]);
            }
        } catch (err) {
            console.error("Failed to connect:", err);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: "Maaf, terjadi kesalahan koneksi ke server AI.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="lg:col-span-1 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>Ask Copilot</span>
                    <span className="text-gray-300 font-light">|</span>

                    <TextLoop className="text-sm font-normal text-gray-500">
                        {[
                            "Ready to assist",
                            "Monitoring Sensors",
                            "Checking Anomalies",
                            "Awaiting Command",
                        ].map((text) => (
                            <span key={text} className="block">
                                {text}
                            </span>
                        ))}
                    </TextLoop>
                </h2>
            </div>

            <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col p-4">
                <Chat
                    className="h-full"
                    messages={messages}
                    setMessages={setMessages}
                    input={input}
                    handleInputChange={(e) => setInput(e.target.value)}
                    handleSubmit={handleSubmit}
                    isGenerating={isLoading}
                    stop={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
}
