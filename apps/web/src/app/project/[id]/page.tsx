"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import {
    DeploymentListItem,
    Deployment,
} from "@/components/DeploymentListItem";
import { toast } from "sonner";
import { AppLoader } from "@/components/AppLoader";

// Определяем полный тип для проекта, включая деплои
interface ProjectDetails {
    id: string;
    name: string;
    gitUrl: string;
    deployments: Deployment[];
}

export default function ProjectDetailsPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
    const params = useParams();
    const projectId = params.id as string;

    const { api } = useApi();
    const fetcher = (endpoint: string) => api(endpoint);

    const swrKey =
        isAuthenticated && projectId ? `/projects/${projectId}` : null;

    const {
        data: project,
        error,
        isLoading,
        mutate,
    } = useSWR<ProjectDetails>(swrKey, fetcher, {
        refreshInterval: 5000,
    });

    const [actionInProgressId, setActionInProgressId] = useState<string | null>(
        null
    );

    const isAnyDeploymentInProgress = project?.deployments.some(
        (dep) => dep.status === "BUILDING" || dep.status === "QUEUED"
    );

    const handleDeploymentAction = (
        deploymentId: string,
        action: "redeploy" | "cancel"
    ) => {
        setActionInProgressId(deploymentId);

        const promise =
            action === "redeploy"
                ? api(
                      `/integrations/vercel/deployments/${deploymentId}/redeploy`,
                      { method: "POST" }
                  )
                : api(
                      `/integrations/vercel/deployments/${deploymentId}/cancel`,
                      { method: "PATCH" }
                  );

        toast.promise(promise, {
            loading: `${action === "redeploy" ? "Starting redeployment" : "Canceling deployment"}...`,
            success: (data) => {
                mutate(
                    (currentData) => {
                        if (!currentData) return currentData;

                        if (action === "redeploy" && data) {
                            const optimisticDeployment: Deployment = {
                                id: data.id || `temp-${Date.now()}`,
                                status: "QUEUED",
                                branch: data.meta?.githubCommitRef || "unknown",
                                commit: data.meta?.githubCommitSha || "...",
                                message:
                                    data.meta?.githubCommitMessage ||
                                    "Redeploying...",
                                creator: "You",
                                createdAt: new Date().toISOString(),
                                url: `https://${data.url}`,
                            };
                            return {
                                ...currentData,
                                deployments: [
                                    optimisticDeployment,
                                    ...currentData.deployments,
                                ],
                            };
                        } else {
                            return {
                                ...currentData,
                                deployments: currentData.deployments.map((d) =>
                                    d.id === deploymentId
                                        ? { ...d, status: "CANCELED" }
                                        : d
                                ),
                            };
                        }
                    },
                    { revalidate: action === "cancel" }
                );

                return `Deployment action successful!`;
            },
            error: (err) => err.message || "An error occurred.",
            finally: () => {
                setActionInProgressId(null);
            },
        });
    };

    if (isAuthLoading || !isAuthenticated) {
        return <AppLoader variant="matrix" text="Loading Project Details..." />;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <Link href="/dashboard">
                    <Button variant="ghost">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <ProjectDetailsSkeleton />
            ) : error ? (
                <div className="text-red-500">Error: {error.message}</div>
            ) : project ? (
                <>
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    <a
                        href={project.gitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        {project.gitUrl}
                    </a>

                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold mb-4">
                            Recent Deployments
                        </h2>

                        {/* Заголовки "таблицы" */}
                        <div className="flex justify-between text-sm text-muted-foreground px-4 py-2 border-b">
                            <span>Details</span>
                            <span>Status & Actions</span>
                        </div>

                        {project.deployments.length > 0 ? (
                            // Оборачиваем список в Accordion
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                            >
                                {project.deployments.map((deployment) => (
                                    <DeploymentListItem
                                        key={deployment.id}
                                        deployment={deployment}
                                        projectGitUrl={project.gitUrl}
                                        onDeploymentAction={
                                            handleDeploymentAction
                                        }
                                        actionInProgressId={actionInProgressId}
                                        isDeploymentLocked={
                                            isAnyDeploymentInProgress
                                        }
                                    />
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-muted-foreground text-center p-8">
                                No deployments found.
                            </p>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
}

// Скелетон для страницы
function ProjectDetailsSkeleton() {
    return (
        <div>
            <Skeleton className="h-10 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-8">
                <Skeleton className="h-8 w-1/4 mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
    );
}
