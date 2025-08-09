"use client";

import { cn } from "@/lib/utils";

type Status =
    | "READY"
    | "BUILDING"
    | "ERROR"
    | "QUEUED"
    | "CANCELED"
    | "NOT_DEPLOYED";

const statusStyles: Record<Status, string> = {
    READY: "bg-green-500",
    BUILDING: "bg-yellow-500 animate-pulse",
    ERROR: "bg-red-500",
    QUEUED: "bg-blue-500",
    CANCELED: "bg-gray-600",
    NOT_DEPLOYED: "bg-gray-400",
};

interface DeploymentStatusBadgeProps {
    status: Status;
}

export function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
    if (!statusStyles[status]) return null;

    return (
        <div className="flex items-center justify-end gap-2">
            <span
                className={cn("h-2 w-2 rounded-full", statusStyles[status])}
            />
            <span className="text-xs capitalize">
                {status.toLowerCase().replace("_", " ")}
            </span>
        </div>
    );
}
