"use client";

import { cn } from "@/lib/utils";
import { VercelLogo } from "./ui/icons";

interface DeploymentData {
    status:
        | "READY"
        | "BUILDING"
        | "ERROR"
        | "QUEUED"
        | "CANCELED"
        | "NOT_DEPLOYED"
        | "NOT_LINKED";
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
                <span
                    className={cn(
                        "h-2 w-2 rounded-full",
                        statusStyles["LOADING"]
                    )}
                />
                <span className="capitalize text-xs text-muted-foreground">
                    Loading...
                </span>
            </div>
        );
    }

    const status = deploymentStatus.status;

    return (
        <div className="flex items-center gap-4">
            <VercelLogo className="h-3 w-3" />
            <span
                className={cn("h-2 w-2 rounded-full", statusStyles[status])}
            />
            <span className="capitalize text-xs">
                {status.toLowerCase().replace("_", " ")}
            </span>
        </div>
    );
}

export default DashboardDeploymentStatus;
