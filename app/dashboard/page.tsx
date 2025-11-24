"use client";

import { useEffect, useState } from "react";
import { EquipmentAlert } from "@/components/equipment-alert";
import { RecommendedActionsHeader } from "@/components/recommended-action";
import { TextLoop } from "@/components/ui/text-loop";
import { Chat } from "@/components/ui/chat";
import { Message } from "@/components/ui/chat-message"; // <-- Pastikan ini ada
import { supabase } from "@/lib/supabase";
import Header from "@/components/header";
import { Wrench } from "lucide-react";

// Tipe untuk Alert (Sama seperti sebelumnya)
type TicketUI = {
  id: number;
  equipmentName: string;
  variant: "warning" | "critical" | "fatal";
  description: string;
  action: string;
  status: string;
};

export default function Home() {
  const [alerts, setAlerts] = useState<TicketUI[]>([]);
  // Inisialisasi messages dengan array kosong bertipe Message[]
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    // Setup Session & Fetch Data
    let currentSession = localStorage.getItem("chat_session_id");
    if (!currentSession) {
      currentSession = "sess_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("chat_session_id", currentSession);
    }
    setSessionId(currentSession);
    fetchAlerts();
    fetchChatHistory(currentSession);
  }, []);

  const fetchAlerts = async () => {
    // ... (Logika fetch alerts sama seperti sebelumnya) ...
    // Saya persingkat demi fokus ke Chatbot
    const { data: dbData } = await supabase
      .from("failure_ticket")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (dbData) {
      const formattedAlerts: TicketUI[] = dbData.map((item: any) => {
        let variant: "warning" | "critical" | "fatal" = "warning";
        const severityLower = (item.severity_level || "").toLowerCase();
        if (severityLower.includes("critical")) variant = "critical";
        else if (severityLower.includes("fatal")) variant = "fatal";

        return {
          id: item.id,
          equipmentName: `Machine Sensor #${item.sensor_id}`,
          variant: variant,
          description: `${item.failure_status} (${(
            item.confidence_score * 100
          ).toFixed(1)}%)`,
          action: item.recommendation || "Inspeksi manual.",
          status: item.is_active ? "Pending" : "Resolved",
        };
      });
      setAlerts(formattedAlerts);
    }
  };

  const fetchChatHistory = async (sessId: string) => {
    const { data, error } = await supabase
      .from("chat_logs")
      .select("*")
      .eq("session_id", sessId)
      .order("timestamp", { ascending: true });

    if (data) {
      const formattedMessages: Message[] = [];
      data.forEach((log: any) => {
        // Format harus sesuai tipe Message dari shadcn-chatbot-kit
        formattedMessages.push({
          id: `u-${log.id}`,
          role: "user",
          content: log.user_query,
          createdAt: new Date(log.timestamp), // Opsional: Tambahkan tanggal jika ada
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

  // --- FUNGSI UTAMA YANG DIPERBAIKI ---
  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // 1. Buat object message baru
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    // 2. Update State Manual (Optimistic UI)
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
        }),
      });

      if (!res.ok) throw new Error("Server Error");

      const data = await res.json();

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
      // Opsional: Kasih pesan error dummy dari bot
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan koneksi ke server.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen  p-6">
      {/* Header */}
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <RecommendedActionsHeader />
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500 italic p-4 bg-white rounded-lg border text-center">
                System Healthy. No active failure tickets.
              </p>
            ) : (
              alerts.map((alert) => (
                <EquipmentAlert
                  key={alert.id}
                  equipmentName={alert.equipmentName}
                  variant={alert.variant}
                  description={alert.description}
                  action={alert.action}
                  actionButtonLabel="Start Repair"
                />
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Chatbot */}
        <div className="lg:col-span-1 h-[600px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>Ask Copilot</span>
              <span className="text-gray-300 font-light">|</span>

              {/* Ini TextLoop-nya */}
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

          <div className="flex-1 p-4 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
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
      </div>
    </main>
  );
}
