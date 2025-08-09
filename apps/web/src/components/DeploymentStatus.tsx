"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface DeploymentStatusProps {
    projectId: string;
}

type Status =
    | "READY"
    | "BUILDING"
    | "ERROR"
    | "QUEUED"
    | "CANCELED"
    | "LOADING"
    | "NOT_DEPLOYED";

const statusStyles: Record<Status, string> = {
    LOADING: "bg-gray-500 animate-pulse",
    READY: "bg-green-500",
    BUILDING: "bg-yellow-500 animate-pulse",
    ERROR: "bg-red-500",
    QUEUED: "bg-blue-500",
    CANCELED: "bg-gray-600",
    NOT_DEPLOYED: "bg-gray-400",
};

export function DeploymentStatus({ projectId }: DeploymentStatusProps) {
    const [status, setStatus] = useState<Status>("LOADING");
    const { api } = useApi();

    useEffect(() => {
        api(`/integrations/vercel/deployments/${projectId}`)
            .then((data) => setStatus(data.status))
            .catch(() => setStatus("ERROR"));
    }, [projectId, api]);

    return (
        <div className="flex items-center gap-2">
            <span
                className={cn("h-2 w-2 rounded-full", statusStyles[status])}
            />
            <span className="text-xs capitalize">
                {status.toLowerCase().replace("_", " ")}
            </span>
        </div>
    );
}
