"use client";

import { useApi } from "@/hooks/useApi";
import useSWR from "swr";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface GithubChecksStatusProps {
    projectId: string;
    // Мы принимаем gitUrl, чтобы не делать лишний запрос за ним
    gitUrl: string | null;
}

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

export function GithubChecksStatus({
    projectId,
    gitUrl,
}: GithubChecksStatusProps) {
    const { api } = useApi();
    const fetcher = (endpoint: string) => api(endpoint);

    // Запускаем запрос только если есть gitUrl
    const { data, error, isLoading } = useSWR<ChecksData>(
        gitUrl ? `/integrations/github/checks/${projectId}` : null,
        fetcher,
        {
            refreshInterval: 30000, // Обновляем каждые 30 секунд
        }
    );

    // Если URL нет, ничего не рендерим
    if (!gitUrl) {
        return null;
    }

    const renderStatus = () => {
        if (isLoading) {
            return {
                Icon: Loader2,
                color: "text-muted-foreground",
                label: "Loading checks...",
                spin: true,
            };
        }
        if (error) {
            return {
                Icon: AlertCircle,
                color: "text-yellow-500",
                label: "Unable to fetch",
                spin: false,
            };
        }
        if (data) {
            if (data.status === "in_progress") {
                return {
                    Icon: Loader2,
                    color: "text-yellow-500",
                    label: "Checks in progress",
                    spin: true,
                };
            }
            if (data.conclusion === "success") {
                return {
                    Icon: CheckCircle2,
                    color: "text-green-500",
                    label: "Checks passed",
                    spin: false,
                };
            }
            if (data.conclusion === "failure") {
                return {
                    Icon: XCircle,
                    color: "text-red-500",
                    label: "Checks failed",
                    spin: false,
                };
            }
        }
        // Статус по умолчанию или для других 'conclusion'
        return {
            Icon: AlertCircle,
            color: "text-muted-foreground",
            label: "No checks found",
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
                {/* Если есть URL, оборачиваем иконку в ссылку */}
                {data?.url ? (
                    <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // Предотвращаем клик по ссылке на проект
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
