"use client";

import { cn } from "@/lib/utils";
import { GitCommitHorizontal, GitBranch } from "lucide-react";

interface DeploymentData {
    status:
        | "READY"
        | "BUILDING"
        | "ERROR"
        | "QUEUED"
        | "CANCELED"
        | "NOT_DEPLOYED"
        | "NOT_LINKED";
    branch: string | null;
    commit: string | null;
}

interface DashboardDeploymentStatusProps {
    deploymentStatus: DeploymentData | null | undefined;
}

const statusStyles: Record<DeploymentData["status"] | "LOADING", string> = {
    LOADING: "bg-gray-500 animate-pulse",
    READY: "bg-green-500",
    BUILDING: "bg-yellow-500 animate-pulse",
    ERROR: "bg-red-500",
    QUEUED: "bg-blue-500",
    CANCELED: "bg-gray-600",
    NOT_DEPLOYED: "bg-gray-400",
    NOT_LINKED: "bg-gray-400",
};

function DashboardDeploymentStatus({
    deploymentStatus,
}: DashboardDeploymentStatusProps) {
    if (!deploymentStatus) {
        return (
            <div className="flex items-center gap-2">
                {" "}
                <span
                    className={cn(
                        "h-2 w-2 rounded-full",
                        statusStyles["LOADING"]
                    )}
                />{" "}
                <span className="capitalize text-xs text-muted-foreground">
                    Loading...
                </span>{" "}
            </div>
        );
    }

    const status = deploymentStatus.status;

    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {deploymentStatus.branch && (
                <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{deploymentStatus.branch}</span>
                </div>
            )}
            {deploymentStatus.commit && (
                <div className="flex items-center gap-1">
                    <GitCommitHorizontal className="h-3 w-3" />
                    <span className="font-mono">
                        {deploymentStatus.commit.slice(0, 7)}
                    </span>
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

export default DashboardDeploymentStatus;
