"use client";

import { useEffect, useState } from "react";
import { EquipmentAlert } from "@/components/equipment-alert";
import { RecommendedActionsHeader } from "@/components/recommended-action";
import { TextLoop } from "@/components/ui/text-loop";
import { Chat } from "@/components/ui/chat";
import { Message } from "@/components/ui/chat-message";
import { createClient } from "@/lib/supabase";
import Header from "@/components/header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

// Tipe untuk Alert
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentAlerts = alerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
    setIsLoadingAlerts(true);
    const supabase = createClient();
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
    setIsLoadingAlerts(false);
  };

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

    // 1. Optimistic UI Update
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
    <main className="min-h-screen p-6 bg-gray-50/50">
      {/* Header Component */}
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Kolom Kiri: Alerts dengan Pagination & Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <RecommendedActionsHeader />
          <div className="space-y-3">
            {isLoadingAlerts ? (
              // Tampilan Loading (Skeleton)
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full mt-2" />
                </div>
              ))
            ) : alerts.length === 0 ? (
              // Tampilan Kosong
              <p className="text-gray-500 italic p-4 bg-white rounded-lg border text-center shadow-sm">
                System Healthy. No active failure tickets.
              </p>
            ) : (
              // Tampilan Data Alerts
              <>
                {currentAlerts.map((alert) => (
                  <EquipmentAlert
                    key={alert.id}
                    equipmentName={alert.equipmentName}
                    variant={alert.variant}
                    description={alert.description}
                    action={alert.action}
                    actionButtonLabel="Start Repair"
                  />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Chatbot */}
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
      </div>
    </main>
  );
}
