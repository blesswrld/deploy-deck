"use client";

import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { GitCommitHorizontal, GitBranch } from "lucide-react";

interface DashboardDeploymentStatusProps {
    projectId: string;
}

interface DeploymentData {
    status:
        | "READY"
        | "BUILDING"
        | "ERROR"
        | "QUEUED"
        | "CANCELED"
        | "NOT_DEPLOYED";
    branch: string | null;
    commit: string | null;
}

type Status = DeploymentData["status"] | "LOADING" | "INITIALIZING";

const statusStyles: Record<Status, string> = {
    LOADING: "bg-gray-500 animate-pulse",
    INITIALIZING: "bg-gray-500 animate-pulse",
    READY: "bg-green-500",
    BUILDING: "bg-yellow-500 animate-pulse",
    ERROR: "bg-red-500",
    QUEUED: "bg-blue-500",
    CANCELED: "bg-gray-600",
    NOT_DEPLOYED: "bg-gray-400",
};

export function DashboardDeploymentStatus({
    projectId,
}: DashboardDeploymentStatusProps) {
    const fetcher = (url: string) => safeApi(url);

    const { data, error, isLoading } = useSWR(
        `/integrations/vercel/deployments/${projectId}`,
        fetcher,
        { refreshInterval: 10000 } // Обновление каждые 10 сек
    );

    let status: Status = "INITIALIZING";
    if (isLoading) status = "LOADING";
    if (error) status = "ERROR";
    if (data) status = data.status;

    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {data?.branch && (
                <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{data.branch}</span>
                </div>
            )}
            {data?.commit && (
                <div className="flex items-center gap-1">
                    <GitCommitHorizontal className="h-3 w-3" />
                    <span className="font-mono">{data.commit}</span>
                </div>
            )}
            <div className="flex items-center gap-2">
                <span
                    className={cn("h-2 w-2 rounded-full", statusStyles[status])}
                />
                <span className="capitalize">
                    {status.toLowerCase().replace("_", " ")}
                </span>
            </div>
        </div>
    );
}
