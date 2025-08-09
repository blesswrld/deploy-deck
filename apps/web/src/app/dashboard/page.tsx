"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useRequireAuth } from "@/hooks/useRequireAuth"; // <-- ХУК
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import { Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddProjectForm } from "@/components/AddProjectForm";
import Link from "next/link";
import { LinkVercelDialog } from "@/components/LinkVercelDialog";
import { DashboardDeploymentStatus } from "@/components/DashboardDeploymentStatus.tsx";
import { ProjectListSkeleton } from "@/components/ProjectListSkeleton";

interface Project {
    id: string;
    name: string;
    gitUrl: string;
    vercelProjectId?: string | null;
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const { setToken } = useAuth();
    const { api } = useApi();

    const [projects, setProjects] = useState<Project[]>([]);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(
        null
    );
    const [projectToLink, setProjectToLink] = useState<Project | null>(null);

    const [isLoadingData, setIsLoadingData] = useState(true);
    // Состояние для открытия/закрытия модального окна
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        }
    }, [isAuthenticated, api]);

    const handleLogout = () => {
        setToken(null);
        // Редирект произойдет автоматически благодаря useRequireAuth
    };

    const handleProjectAdded = (newProject: Project) => {
        // Перед добавлением проверяем, нет ли уже проекта с таким ID в списке
        setProjects((currentProjects) => {
            if (currentProjects.some((p) => p.id === newProject.id)) {
                return currentProjects; // Если есть - ничего не меняем
            }
            return [...currentProjects, newProject]; // Если нет - добавляем
        });
    };

    const handleProjectUpdated = (updatedProject: Project) => {
        setProjects((currentProjects) =>
            currentProjects.map((p) =>
                p.id === updatedProject.id ? updatedProject : p
            )
        );
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        const promise = api(`/projects/${projectToDelete.id}`, {
            method: "DELETE",
        });

        toast.promise(promise, {
            loading: "Deleting project...",
            success: () => {
                // Удаляем проект из списка на клиенте
                setProjects((projects) =>
                    projects.filter((p) => p.id !== projectToDelete.id)
                );
                setProjectToDelete(null); // Закрываем диалог
                return "Project deleted successfully!";
            },
            error: (err) => err.message || "Failed to delete project",
        });
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
                <div className="flex items-center gap-4">
                    {/* Кнопка, открывающая модальное окно */}
                    <Dialog
                        open={isDialogOpen || !!projectToEdit}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setIsDialogOpen(false);
                                setProjectToEdit(null);
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                Add New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {projectToEdit
                                        ? "Edit Project"
                                        : "Add a new project"}
                                </DialogTitle>
                                <DialogDescription>
                                    {projectToEdit
                                        ? "Make changes to your project here. Click save when you are done."
                                        : "Enter the details of your project to start tracking deployments."}
                                </DialogDescription>
                            </DialogHeader>
                            <AddProjectForm
                                // Добавляем key. Если мы создаем проект, ключ будет 'create'.
                                // Если редактируем, ключ будет равен ID проекта.
                                key={
                                    projectToEdit ? projectToEdit.id : "create"
                                }
                                onProjectAdded={handleProjectAdded}
                                onProjectUpdated={handleProjectUpdated}
                                projectToEdit={projectToEdit} // <-- Передаем данные для редактирования
                                onClose={() => {
                                    setIsDialogOpen(false);
                                    setProjectToEdit(null);
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>

                    <Button onClick={handleLogout} variant="outline">
                        Log Out
                    </Button>
                </div>
            </header>
            <main>
                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData ? (
                            <ProjectListSkeleton />
                        ) : projects.length > 0 ? (
                            <ul className="space-y-4">
                                {projects.map((project) => (
                                    <li
                                        key={project.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <Link
                                            href={`/project/${project.id}`}
                                            className="flex-grow"
                                        >
                                            <div>
                                                <p className="font-semibold text-lg hover:underline">
                                                    {project.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.gitUrl}
                                                </p>
                                            </div>
                                        </Link>

                                        {/* Правая часть с кнопками остается без Link */}
                                        <div className="flex items-center gap-2 pl-4">
                                            {project.vercelProjectId ? (
                                                // Если проект связан, показываем компонент статуса
                                                <DashboardDeploymentStatus
                                                    projectId={project.id}
                                                />
                                            ) : (
                                                // Иначе показываем кнопку "Link"
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // <-- Останавливаем "всплытие" клика
                                                        setProjectToLink(
                                                            project
                                                        );
                                                    }}
                                                >
                                                    Link to Vercel
                                                </Button>
                                            )}

                                            {/* ВЫПАДАЮЩЕЕ МЕНЮ */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>
                                                        Actions
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setProjectToEdit(
                                                                project
                                                            ); // <-- Сохраняем проект для редактирования
                                                            setIsDialogOpen(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() =>
                                                            setProjectToDelete(
                                                                project
                                                            )
                                                        } // <-- Устанавливаем проект для удаления
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>You don't have any projects yet.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
            <AlertDialog
                open={!!projectToDelete}
                onOpenChange={(isOpen) => !isOpen && setProjectToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your project "{projectToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProject}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <LinkVercelDialog
                projectToLink={projectToLink}
                onClose={() => setProjectToLink(null)}
                onLinked={handleProjectUpdated}
            />
        </div>
    );
}
