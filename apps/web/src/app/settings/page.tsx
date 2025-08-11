"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/SettingsForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, Triangle } from "lucide-react";
import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useEffect } from "react";

// Определим тип для данных пользователя
interface UserProfile {
    githubUsername?: string;
}

export default function SettingsPage() {
    const { isAuthenticated, isLoading } = useRequireAuth();
    const { api } = useApi();
    const fetcher = (url: string) => api(url);
    const { mutate } = useSWRConfig();
    const searchParams = useSearchParams(); // Хук для чтения URL-параметров
    const router = useRouter();

    // Запрашиваем данные о пользователе
    const { data: user, isLoading: isUserLoading } = useSWR<UserProfile>(
        isAuthenticated ? "/users/me" : null,
        fetcher
    );

    console.log(
        "Settings page rendered. Search params:",
        searchParams.toString()
    );

    useEffect(() => {
        const githubStatus = searchParams.get("github-status");
        const message = searchParams.get("message");

        if (githubStatus === "success") {
            toast.success("GitHub account connected successfully!");
        } else if (githubStatus === "error") {
            toast.error("Failed to connect GitHub account", {
                description: message || "An unknown error occurred.",
            });
        }

        // Мы чистим URL, только если параметры существуют,
        // и делаем это с небольшой задержкой через setTimeout.
        if (githubStatus) {
            // Задержка в 100 миллисекунд. Этого более чем достаточно.
            setTimeout(() => {
                router.replace("/settings", { scroll: false });
            }, 100);
        }
    }, [searchParams, router]);

    const handleConnectGithub = async () => {
        try {
            // Запрашиваем новый эндпоинт, который вернет URL с нашим userId в state
            const response = await api("/integrations/github/redirect-url");
            window.location.href = response.redirectUrl;
        } catch (error: any) {
            toast.error(error.message || "Failed to connect to GitHub");
        }
    };

    const handleDisconnectGithub = async () => {
        const promise = api("/integrations/github", {
            method: "DELETE",
        });

        toast.promise(promise, {
            loading: "Disconnecting GitHub account...",
            success: (data) => {
                mutate("/users/me"); // <-- Говорим SWR обновить данные для ключа '/users/me'
                return data.message || "GitHub account disconnected.";
            },
            error: (err) => err.message,
        });
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Authenticating...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
            <div className="mb-8">
                <Link href="/dashboard">
                    <Button variant="ghost">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Integrations</CardTitle>
                        <CardDescription>
                            Connect your accounts from other services to
                            Deploy-Deck.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* БЛОК ДЛЯ VERCEL */}
                        <div>
                            <h3 className="flex items-center text-lg font-semibold mb-4">
                                <Triangle className="mr-2 h-5 w-5 fill-current" />
                                Vercel
                            </h3>
                            <SettingsForm />
                        </div>

                        {/* БЛОК ДЛЯ GITHUB */}
                        <div>
                            <h3 className="flex items-center text-lg font-semibold mb-4">
                                <Github className="mr-2 h-4 w-4 fill-current" />
                                GitHub
                            </h3>
                            {isUserLoading ? (
                                <p>Loading GitHub connection status...</p>
                            ) : user?.githubUsername ? (
                                <div className="flex flex-wrap gap-y-3 items-center justify-between p-4 border rounded-md">
                                    <p>
                                        Connected as{" "}
                                        <span className="font-semibold">
                                            {user.githubUsername}
                                        </span>
                                    </p>
                                    {/* КНОПКА DISCONNECT*/}
                                    <Button
                                        variant="destructive"
                                        onClick={handleDisconnectGithub}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={handleConnectGithub}>
                                    <Github className="mr-2 h-4 w-4" />
                                    Connect GitHub Account
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
