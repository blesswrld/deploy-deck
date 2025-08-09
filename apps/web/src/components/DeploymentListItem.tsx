"use client";

import { GitCommitHorizontal, GitBranch, UserCircle } from "lucide-react";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import { format, formatDistanceToNow } from "date-fns";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { LogViewer } from "./LogViewer";

// Определяем тип для деплоя, чтобы TypeScript нам помогал
export interface Deployment {
    id: string;
    status:
        | "READY"
        | "BUILDING"
        | "ERROR"
        | "QUEUED"
        | "CANCELED"
        | "NOT_DEPLOYED";
    branch: string;
    commit: string;
    message: string;
    creator: string;
    createdAt: string;
    commitUrl?: string;
}

interface DeploymentListItemProps {
    deployment: Deployment;
    projectGitUrl: string; // <-- URL репозитория
}

export function DeploymentListItem({
    deployment,
    projectGitUrl,
}: DeploymentListItemProps) {
    // Форматируем дату в "X minutes ago"
    const timeAgo = formatDistanceToNow(new Date(deployment.createdAt), {
        addSuffix: true,
    });
    const fullDate = format(new Date(deployment.createdAt), "PPP p"); // Форматируем в 'MMM d, yyyy, h:mm:ss a'

    // Формируем URL для коммита на GitHub
    const commitUrl =
        deployment.commit !== "N/A"
            ? `${projectGitUrl.replace(".git", "")}/commit/${deployment.commit}`
            : undefined;

    return (
        <AccordionItem value={deployment.id} className="border-b">
            <AccordionTrigger className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-4 gap-4 hover:bg-muted/50 hover:no-underline text-left">
                {/* Левая часть */}
                <div>
                    <div className="font-medium">{deployment.message}</div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                            <UserCircle className="h-3 w-3" />
                            <span>{deployment.creator}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{deployment.branch}</span>
                        </div>

                        {/* Делаем хэш коммита ссылкой */}
                        {commitUrl ? (
                            <a
                                href={commitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:underline"
                            >
                                <GitCommitHorizontal className="h-3 w-3" />
                                <span className="font-mono">
                                    {deployment.commit}
                                </span>
                            </a>
                        ) : (
                            <div className="flex items-center gap-1">
                                <GitCommitHorizontal className="h-3 w-3" />
                                <span className="font-mono">
                                    {deployment.commit}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Правая часть */}
                <div className="w-full sm:w-auto text-left sm:text-right">
                    <DeploymentStatusBadge status={deployment.status} />

                    {/* Добавляем HoverCard для времени */}
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="text-xs text-muted-foreground mt-1 cursor-pointer">
                                {timeAgo}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto">
                            <p className="text-sm">{fullDate}</p>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="p-4 pt-0">
                    <LogViewer deploymentId={deployment.id} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
