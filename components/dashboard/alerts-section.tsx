"use client";

import { useEffect, useState } from "react";
import { EquipmentAlert } from "@/components/equipment-alert";
import { RecommendedActionsHeader } from "@/components/recommended-action";
import { createClient } from "@/lib/supabase";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

type TicketUI = {
    id: number;
    equipmentName: string;
    variant: "warning" | "critical" | "fatal";
    description: string;
    action: string;
    status: string;
};

export function AlertsSection() {
    const [alerts, setAlerts] = useState<TicketUI[]>([]);
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
        fetchAlerts();
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

    return (
        <div className="lg:col-span-2 space-y-4">
            <RecommendedActionsHeader />
            <div className="space-y-3">
                {isLoadingAlerts ? (
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
                    <p className="text-gray-500 italic p-4 bg-white rounded-lg border text-center shadow-sm">
                        System Healthy. No active failure tickets.
                    </p>
                ) : (
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

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                            (page) => (
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
                                            )
                                        )}

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
    );
}
