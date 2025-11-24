"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle } from "lucide-react";

type AlertVariant = "warning" | "critical" | "fatal";

interface EquipmentAlertProps {
  equipmentName: string;
  variant: AlertVariant;
  description: string;
  action: string;
  onActionClick?: () => void;
  actionButtonLabel?: string;
}

export function EquipmentAlert({
  equipmentName,
  variant,
  description,
  action,
}: EquipmentAlertProps) {
  const variantStyles = {
    warning: {
      card: "bg-white border-gray-200",
      icon: "text-yellow-500",
      badge: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      descriptionText: "text-yellow-600",
      actionBox: "bg-yellow-50 border-yellow-200",
      actionText: "text-gray-700",
    },
    critical: {
      card: "bg-white border-gray-200",
      icon: "text-red-500",
      badge: "bg-red-100 text-red-800 hover:bg-red-100",
      descriptionText: "text-red-600",
      actionBox: "bg-red-50 border-red-200",
      actionText: "text-gray-700",
    },
    fatal: {
      card: "bg-white border-gray-200",
      icon: "text-red-600",
      badge: "bg-red-200 text-red-900 hover:bg-red-200",
      descriptionText: "text-red-700",
      actionBox: "bg-red-100 border-red-300",
      actionText: "text-gray-900",
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = variant === "fatal" ? AlertCircle : AlertTriangle;

  return (
    <Card className={`border p-5 ${styles.card}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <IconComponent className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
          <h3 className="font-semibold text-gray-900">{equipmentName}</h3>
          <Badge className={styles.badge} variant="secondary">
            {variant}
          </Badge>
        </div>

        <p className={`text-sm ${styles.descriptionText}`}>{description}</p>

        <div className={`rounded border ${styles.actionBox} p-4`}>
          <p className={`text-sm ${styles.actionText}`}>
            <span className="font-semibold">Action:</span> {action}
          </p>
        </div>
      </div>
    </Card>
  );
}
