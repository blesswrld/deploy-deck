"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
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
import { ArrowLeft, Github } from "lucide-react";
import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";

// Определим тип для данных пользователя
interface UserProfile {
    githubUsername?: string;
}

export default function SettingsPage() {
    const { isAuthenticated, isLoading } = useRequireAuth();
    const { api } = useApi();
    const fetcher = (url: string) => api(url);

    // Запрашиваем данные о пользователе
    const { data: user, isLoading: isUserLoading } = useSWR<UserProfile>(
        isAuthenticated ? "/users/me" : null,
        fetcher
    );

    const handleConnectGithub = async () => {
        try {
            // Запрашиваем новый эндпоинт, который вернет URL с нашим userId в state
            const response = await api("/integrations/github/redirect-url");
            window.location.href = response.redirectUrl;
        } catch (error: any) {
            toast.error(error.message || "Failed to connect to GitHub");
        }
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
                            <h3 className="text-lg font-semibold mb-4">
                                Vercel
                            </h3>
                            <SettingsForm />
                        </div>

                        {/* БЛОК ДЛЯ GITHUB */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">
                                GitHub
                            </h3>
                            {isUserLoading ? (
                                <p>Loading GitHub connection status...</p>
                            ) : user?.githubUsername ? (
                                <div className="flex items-center justify-between p-4 border rounded-md">
                                    <p>
                                        Connected as{" "}
                                        <span className="font-semibold">
                                            {user.githubUsername}
                                        </span>
                                    </p>
                                    {/* TODO: Add disconnect button */}
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
