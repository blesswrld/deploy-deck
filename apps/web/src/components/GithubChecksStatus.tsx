"use client";

import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ChecksData {
    status: "completed" | "in_progress" | "not_found";
    conclusion:
        | "success"
        | "failure"
        | "neutral"
        | "cancelled"
        | "skipped"
        | "timed_out"
        | null;
    url: string | null;
}

interface GithubChecksStatusProps {
    checksStatus: ChecksData | null | undefined;
}

function GithubChecksStatus({ checksStatus }: GithubChecksStatusProps) {
    if (!checksStatus) {
        return null;
    }

    const renderStatus = () => {
        if (checksStatus.status === "in_progress") {
            return {
                Icon: Loader2,
                color: "text-yellow-500",
                label: "Checks in progress",
                spin: true,
            };
        }
        if (checksStatus.conclusion === "success") {
            return {
                Icon: CheckCircle2,
                color: "text-green-500",
                label: "Checks passed",
                spin: false,
            };
        }
        if (checksStatus.conclusion === "failure") {
            return {
                Icon: XCircle,
                color: "text-red-500",
                label: "Checks failed",
                spin: false,
            };
        }
        return {
            Icon: AlertCircle,
            color: "text-muted-foreground",
            label: "Checks status unknown",
            spin: false,
        };
    };

    const { Icon, color, label, spin } = renderStatus();

    const StatusIcon = (
        <div className={`flex items-center gap-1 ${color}`}>
            <Icon className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
        </div>
    );

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                {checksStatus.url ? (
                    <a
                        href={checksStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {StatusIcon}
                    </a>
                ) : (
                    // Иначе просто показываем иконку
                    StatusIcon
                )}
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">{label}</HoverCardContent>
        </HoverCard>
    );
}

export default GithubChecksStatus;
