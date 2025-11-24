"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { EquipmentAlert } from "@/components/equipment-alert";
import { RecommendedActionsHeader } from "@/components/recommended-action";
import { Chat } from "@/components/ui/chat";
import { supabase } from "@/lib/supabase";
import { Message } from "@/components/ui/chat-message";

// Tipe data yang diharapkan oleh UI Component (JANGAN UBAH INI)
type TicketUI = {
  id: number;
  equipmentName: string; // Frontend minta camelCase
  variant: "warning" | "critical" | "fatal";
  description: string;
  action: string;
  status: string;
};

export default function Home() {
  const [alerts, setAlerts] = useState<TicketUI[]>([]); // Pakai tipe UI
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  // --- 1. SETUP SESSION ---
  useEffect(() => {
    let currentSession = localStorage.getItem("chat_session_id");
    if (!currentSession) {
      currentSession = "sess_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("chat_session_id", currentSession);
    }
    setSessionId(currentSession);

    fetchAlerts();
    fetchChatHistory(currentSession);
  }, []);

  // --- 2. FETCH ALERTS (DENGAN MAPPING YANG BENAR) ---
  const fetchAlerts = async () => {
    // Ambil data mentah dari Database (sesuai nama kolom tabel kamu)
    const { data: dbData, error } = await supabase
      .from("failure_ticket")
      .select("*")
      .eq("is_active", true) // Hanya ambil tiket aktif
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetch alerts:", error);
      return;
    }

    if (dbData) {
      // LAKUKAN MAPPING DI SINI: Dari Database Schema -> ke UI Schema
      const formattedAlerts: TicketUI[] = dbData.map((item: any) => {
        // Logika konversi severity_level ke variant UI
        let variant: "warning" | "critical" | "fatal" = "warning"; // Default

        const severityLower = (item.severity_level || "").toLowerCase();
        if (severityLower.includes("critical")) variant = "critical";
        else if (severityLower.includes("fatal")) variant = "fatal";
        else if (severityLower.includes("safe")) variant = "warning"; // Safe tetap warning atau di-hide?

        return {
          id: item.id,
          // Mapping: sensor_id -> equipmentName
          equipmentName: `Machine Sensor #${item.sensor_id}`,

          // Mapping: severity_level -> variant
          variant: variant,

          // Mapping: failure_status -> description
          description: `${item.failure_status} (Confidence: ${(
            item.confidence_score * 100
          ).toFixed(1)}%)`,

          // Mapping: recommendation -> action
          action: item.recommendation || "Lakukan inspeksi manual.",

          status: item.is_active ? "Pending" : "Resolved",
        };
      });

      setAlerts(formattedAlerts);
    }
  };

  // --- 3. FETCH CHAT HISTORY (Sama seperti sebelumnya) ---
  const fetchChatHistory = async (sessId: string) => {
    const { data, error } = await supabase
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
        });
        formattedMessages.push({
          id: `b-${log.id}`,
          role: "assistant",
          content: log.bot_response,
        });
      });
      setMessages(formattedMessages);
    }
  };

  // --- 4. HANDLE SUBMIT (Panggil API Flask/Vercel) ---
  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // ✅ Cek dulu apakah API URL ada
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          "API URL tidak dikonfigurasi. Tambahkan NEXT_PUBLIC_API_URL di .env.local"
        );
      }

      console.log("🔍 Calling API:", `${apiUrl}/chat`); // Debug log

      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          session_id: sessionId,
        }),
      });

      // ✅ Cek status HTTP
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.status === "success") {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Jika backend return status bukan success
        throw new Error(data.message || "Unknown error from API");
      }
    } catch (err) {
      console.error("❌ Failed to connect:", err);

      // ✅ Tampilkan error message ke user
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Maaf, terjadi kesalahan: ${
          err instanceof Error ? err.message : "Tidak dapat terhubung ke server"
        }`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mb-8 flex items-center gap-2">
        <Wrench className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Predictive Maintenance Copilot
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <RecommendedActionsHeader />
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500 italic">
                System Healthy. No active failure tickets.
              </p>
            ) : (
              alerts.map((alert) => (
                <EquipmentAlert
                  key={alert.id}
                  // Gunakan properti hasil mapping di atas
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

        <div className="lg:col-span-1 h-[600px] flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Maintenance Assistant
            </h2>
          </div>

          <div className="">
            <Chat
              messages={messages}
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
