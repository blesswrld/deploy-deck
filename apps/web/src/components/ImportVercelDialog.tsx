"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { AppLoader } from "./AppLoader";

// Проект, готовый к импорту
interface ImportableProject {
    vercelProjectId: string;
    name: string;
    framework: string;
    gitUrl: string | null;
}

interface ImportVercelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectImported: (newProject: any) => void;
}

export function ImportVercelDialog({
    isOpen,
    onClose,
    onProjectImported,
}: ImportVercelDialogProps) {
    const { api } = useApi();
    const [projects, setProjects] = useState<ImportableProject[]>([]);
    // СОСТОЯНИЕ ДЛЯ ЗАГРУЗКИ ПРОЕКТОВ
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true); // Включаем лоадер при каждом открытии
            setProjects([]);

            api("/integrations/vercel/importable-projects")
                .then(setProjects)
                .catch((err) => {
                    toast.error("Could not fetch Vercel projects", {
                        description: err.message,
                    });
                    onClose();
                })
                .finally(() => {
                    setIsLoading(false); // Выключаем лоадер после завершения запроса
                });
        }
    }, [isOpen, api, onClose]);

    const handleImport = (project: ImportableProject) => {
        // Мы передаем все данные, полученные от нашего эндпоинта, на /projects
        const promise = api("/projects", {
            method: "POST",
            body: JSON.stringify({
                name: project.name, // Имя из Vercel
                gitUrl: project.gitUrl, // Git URL, который мы получили
                vercelProjectId: project.vercelProjectId, // ID проекта из Vercel для связывания
            }),
        });

        toast.promise(promise, {
            loading: `Importing "${project.name}"...`,
            success: (importedProject) => {
                onProjectImported(importedProject);
                // Фильтруем список, чтобы убрать только что импортированный проект
                setProjects((prev) =>
                    prev.filter(
                        (p) =>
                            p.vercelProjectId !==
                            importedProject.vercelProjectId
                    )
                );
                onClose();

                return "Project imported successfully!";
            },
            error: (err) => err.message,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import from Vercel</DialogTitle>
                    <DialogDescription>
                        Select a project to import into Deploy-Deck.
                    </DialogDescription>
                </DialogHeader>

                {/* ЛОАДЕР */}
                {isLoading ? (
                    // Используем AppLoader с вариантом 'dots'
                    <div className="h-64 flex items-center justify-center">
                        <AppLoader variant="dots" text="Fetching projects..." />
                    </div>
                ) : (
                    <div
                        className="max-h-80 overflow-y-auto space-y-2 pr-2 
                         scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                    >
                        {projects.length > 0 ? (
                            projects.map((project) => (
                                <div
                                    key={project.vercelProjectId}
                                    className="flex justify-between items-center p-2 border rounded-md"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {project.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {project.framework}
                                        </p>
                                    </div>
                                    {/* Кнопка "Import" неактивна, если нет gitUrl */}
                                    <Button
                                        size="sm"
                                        onClick={() => handleImport(project)}
                                        disabled={!project.gitUrl}
                                    >
                                        {project.gitUrl
                                            ? "Import"
                                            : "No Git Repo"}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                No new projects to import.
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
