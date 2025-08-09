"use client";

import { useApi } from "@/hooks/useApi";
import useSWR from "swr";
import { Skeleton } from "./ui/skeleton";

interface LogViewerProps {
    deploymentId: string;
}

export function LogViewer({ deploymentId }: LogViewerProps) {
    const { api } = useApi();
    const fetcher = (endpoint: string) => api(endpoint);

    // Используем SWR для ленивой загрузки логов
    const { data, error, isLoading } = useSWR(
        `/integrations/vercel/deployments/${deploymentId}/logs`,
        fetcher
    );

    if (isLoading) {
        return <Skeleton className="h-40 w-full rounded-md" />;
    }

    if (error) {
        return (
            <p className="text-red-500 text-xs">
                Error loading logs: {error.message}
            </p>
        );
    }

    return (
        <pre
            className="bg-gray-900 text-white font-mono text-xs p-4 rounded-md 
                 overflow-x-auto max-h-80 
                 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
            <code>{data?.logs || "No logs available."}</code>
        </pre>
    );
}
