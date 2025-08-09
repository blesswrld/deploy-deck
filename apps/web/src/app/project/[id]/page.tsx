"use client";

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

    const {
        data: project,
        error,
        isLoading,
    } = useSWR<ProjectDetails>(
        isAuthenticated && projectId ? `/projects/${projectId}` : null,
        fetcher
    );

    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Authenticating...
            </div>
        );
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
                            <span>Status</span>
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
