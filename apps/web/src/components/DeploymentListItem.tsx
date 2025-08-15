"use client";

import {
    GitCommitHorizontal,
    GitBranch,
    ExternalLink,
    RotateCcw,
    XCircle,
    Loader2,
} from "lucide-react";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import { format, formatDistanceToNow } from "date-fns";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { LogViewer } from "./LogViewer";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
    creatorAvatarUrl?: string | null; // <-- поле для аватара
    createdAt: string;
    commitUrl?: string;
    url: string;
}

interface DeploymentListItemProps {
    deployment: Deployment;
    projectGitUrl: string; // <-- URL репозитория
    onDeploymentAction: (
        deploymentId: string,
        action: "redeploy" | "cancel"
    ) => void;
    actionInProgressId: string | null;
    isDeploymentLocked?: boolean;
}

export function DeploymentListItem({
    deployment,
    projectGitUrl,
    onDeploymentAction,
    actionInProgressId,
    isDeploymentLocked = false,
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

    const isThisItemLoading = actionInProgressId === deployment.id;

    // Добавляем вычисление
    const isNotDeployed = deployment.status === "NOT_DEPLOYED";

    return (
        <AccordionItem
            value={deployment.id}
            className="border-b"
            disabled={isNotDeployed}
        >
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between w-full p-4 gap-4 hover:bg-muted/50">
                <AccordionTrigger
                    className="flex-grow p-0 hover:no-underline text-left"
                    // ПЕРЕДАЕМ ПРОП НАПРЯМУЮ
                    isNotDeployed={isNotDeployed}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 mr-2.5 md:mr-0">
                        {/* Левая часть */}
                        <div className="flex-grow flex-wrap w-full break-words">
                            <div
                                className="font-medium"
                                title={deployment.message}
                            >
                                {deployment.message}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                                <div className="flex items-center gap-1.5">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage
                                            src={
                                                deployment.creatorAvatarUrl ??
                                                undefined
                                            }
                                        />
                                        <AvatarFallback className="text-[10px]">
                                            {deployment.creator?.charAt(0) ||
                                                "?"}
                                        </AvatarFallback>
                                    </Avatar>
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
                                        onClick={(e) => e.stopPropagation()}
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
                        <div className="w-full sm:w-48 sm:text-right flex sm:flex-col items-center justify-between sm:justify-start">
                            <DeploymentStatusBadge status={deployment.status} />
                        </div>
                    </div>
                </AccordionTrigger>
                <div className="flex items-center justify-end gap-2 mt-1 w-full">
                    {(deployment.status === "READY" ||
                        deployment.status === "CANCELED" ||
                        deployment.status === "ERROR") && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title={
                                isDeploymentLocked
                                    ? "Another deployment is in progress"
                                    : "Redeploy"
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeploymentAction(deployment.id, "redeploy");
                            }}
                            disabled={
                                isDeploymentLocked ||
                                actionInProgressId !== null
                            }
                        >
                            {isThisItemLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="h-4 w-4" />
                            )}
                            <span className="sr-only">Redeploy</span>
                        </Button>
                    )}
                    {(deployment.status === "BUILDING" ||
                        deployment.status === "QUEUED") && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                            title="Cancel Deployment"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeploymentAction(deployment.id, "cancel");
                            }}
                            disabled={actionInProgressId !== null}
                        >
                            {isThisItemLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">Cancel Deployment</span>
                        </Button>
                    )}

                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="text-xs text-muted-foreground cursor-pointer">
                                {timeAgo}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto">
                            <p className="text-sm">{fullDate}</p>
                        </HoverCardContent>
                    </HoverCard>

                    <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        title="Open deployment in Vercel"
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Open in Vercel</span>
                    </a>
                </div>
            </div>
            <AccordionContent>
                <div className="p-4 pt-0">
                    <LogViewer deploymentId={deployment.id} />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
