"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth"; // <-- ХУК
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Project {
    id: string;
    name: string;
    gitUrl: string;
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const { setToken } = useAuth();
    const { api } = useApi();

    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        // Загружаем проекты, только если пользователь точно аутентифицирован
        if (isAuthenticated) {
            const fetchProjects = async () => {
                setIsLoadingData(true);
                try {
                    const data = await api("/projects");

                    setProjects(data);
                } catch (error: any) {
                    toast.error(`Failed to fetch projects: ${error.message}`);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchProjects();
        } else {
        }
    }, [isAuthenticated, api]);

    const handleLogout = () => {
        setToken(null);
        // Редирект произойдет автоматически благодаря useRequireAuth
    };

    // Пока идет проверка аутентификации, показываем заглушку
    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Authenticating...
            </div>
        );
    }

    // Основной интерфейс
    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Your Dashboard</h1>
                <Button onClick={handleLogout} variant="outline">
                    Log Out
                </Button>
            </header>
            <main>
                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <p>Loading projects...</p>
                        ) : projects.length > 0 ? (
                            <ul className="space-y-4">
                                {projects.map((project) => (
                                    <li
                                        key={project.id}
                                        className="border-b pb-2"
                                    >
                                        <p className="font-semibold text-lg">
                                            {project.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {project.gitUrl}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You don't have any projects yet.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
